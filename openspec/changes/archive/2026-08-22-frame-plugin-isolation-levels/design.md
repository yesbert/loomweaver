## Context

See proposal.md — Why. Three things ground the approach; the third was measured rather than assumed.

**How little is actually wired.** The restriction the frame runs under is one constant in two places
— the runtime frame and the visible surface template — and a test pins its value. The origin rule is
one comparison at the RPC seam. The mechanism is not the expensive part of this change; the
guarantees are.

**Which guarantees presuppose the strict level.** Of the ten requirements the capability carries,
eight describe the mechanism and hold at any level: the shared contract, the same broker, data-only
crossing, no functions across, the pushed surroundings, acting within one's own address, the host's
own controls, lifecycle, and settings the workbench owns. Two are about restriction and are the ones
this change gives a subject.

**What separate origins actually buy.** A frozen team application is the failure this level makes
possible, so the question is whether the workbench freezes with it. Measured with a synchronous
1500 ms busy loop in the child and the parent's own timer as the witness:

| Arrangement | Chromium | Firefox 154 | Safari 26.6 |
|---|---|---|---|
| Same origin (a proxy re-hosting under a path) | 1501 ms — freezes | 1500 ms — freezes | 1504 ms — freezes |
| Sibling subdomain, no origin-keying header | 1501 ms — freezes | 1500 ms — freezes | 1502 ms — freezes |
| Sibling subdomain + origin-keying header | **6 ms — keeps running** | 1501 ms — freezes | 1503 ms — freezes |
| Unrelated site | 6 ms — keeps running | 3 ms — keeps running | 0 ms — keeps running |

**The origin-keying header does not buy fault isolation on the web; it buys it in Chromium.** The
two other engines are not failing to receive it — Firefox reports the origin as keyed and freezes
anyway, and Safari does not implement the property at all. Origin-keying and process separation are
different things, and translating one into the other is an implementation's choice.

The control freezes in all three and an unrelated site freezes in none, so the measurement is sound
in each. **Fault isolation that holds everywhere costs a cross-site origin** — and with it the
domain-wide cookie that made single sign-on free.

Three corrections were needed to get there, and all three are worth recording because they are easy
to repeat. The first metric measured gaps *between* recorded ticks and therefore missed a stall that
began before the first tick; the stall is the interval from the trigger to the next tick. The
automation build of Chromium runs without full site isolation, which made even an unrelated site
appear to freeze the parent — with site isolation forced on, it does not.

And the third is a property of the mechanism rather than of the harness, so it matters beyond this
measurement: **whether an origin is origin-keyed is decided once per browsing context group.** A
first run that reused one host for both sibling arrangements loaded it without the header, and that
decision then held for the arrangement that sets the header — which reported, wrongly, that the
header does nothing. Each arrangement needs a host of its own.

The same property applies in production: an origin loaded once without the header keeps its keying
for the rest of that browsing context group, so the header has to be on **every** response from
that origin, not only the document that happens to matter.

The figures were taken against a real HTTPS server on real hostnames rather than a harness
fulfilling requests, and the two non-Chromium columns come from installed browsers opened by hand.
That last part is not fastidiousness: an automation harness drives its own builds of those engines,
and those builds blocked in *every* arrangement, including ones Chromium proved were fine — the same
false negative Chromium's own default build produced. Anyone repeating this has to open it by hand;
the probe under `platform/tools/` is what to open.

## Goals / Non-Goals

**Goals:**

- An organisation can compose its own applications into the workbench as separately deployed units
  without giving up the session and the storage they already have.
- What the workbench promises about a frame is true of the frame in front of you, rather than of the
  one level it was originally built for.
- The vocabulary stops predicting restriction where there is none.

**Non-Goals:**

- **Authentication.** How any frame plugin proves who it is to an API is `plugin-data-access`, and
  it is undecided. This change makes a level possible that happens to inherit a session from its
  origin; it invents nothing about tokens.
- **Policing an embedded application.** At the embedded level the plugin can reach the hosting
  application, and no amount of platform mechanism changes that. What the platform owes here is to
  stop claiming otherwise.
- **Deciding a product's deployment.** Whether teams are re-hosted under one origin or served from
  sibling subdomains is theirs; the platform's job is to work with either.

## Decisions

### Two named levels, not a set of switches

The composition chooses between *isolated* and *embedded*. It does not hand the platform a raw list
of browser restrictions to apply.

A pass-through would be more flexible and worse: the browser's own restriction vocabulary would
become part of our contract, every combination would be a configuration nobody has reviewed, and the
combinations that matter are two. Two named levels are reviewable, are what a reader of a
composition sees, and leave the platform free to change how each is achieved.

### The permitted origins are a separate axis from the level

The level says how much the frame is restricted; the permitted origins say where its documents may
come from. They are orthogonal, and the combination the measurement favours needs both: an
application embedded at the permissive level but served from a **sibling subdomain**.

There are three arrangements a product can choose, and the measurement decides which one to
recommend:

| | Re-hosted under one origin | Sibling subdomain | Cross-site origin |
|---|---|---|---|
| Session carried by a domain-wide cookie | yes | yes — same site, so the usual third-party restrictions do not apply | **no** |
| Storage of its own | no, shared with the workbench and every other team | yes | yes |
| Can corrupt the hosting document | yes | no | no |
| Can seize the whole origin's background worker | yes, unless the serving layer prevents it | structurally impossible | structurally impossible |
| Survives a frozen team application | no | **only in Chromium** | yes, everywhere |
| Calls to the product's API | plain | need the origin permitted | need the origin permitted, cross-site |

**The sibling subdomain is what the guide recommends, and fault isolation is not the reason.** It
is what buys the three properties that hold in every engine — its own storage, no reach into the
hosting document, and a background worker that cannot escape its own path — while leaving single
sign-on free. Surviving a frozen application comes with it in Chromium and nowhere else, so it is a
bonus to mention and never a promise to make.

A product for which one team's runaway loop must not freeze the workbench in every browser has to
pay for it with a cross-site origin, and then owes itself an answer on how that origin authenticates
— which is `plugin-data-access`, and undecided. A product already proxying under one origin is not
forced to change; it should merely know it has none of the three.

### The composition caps the level; asking is allowed, but only downwards

The first draft of this change forbade a plugin to declare, request or negotiate its level at all.
That was too strong, and it contradicted the model the platform already uses everywhere else: a
grant is what the distribution allows, intersected with what the plugin asks for. The level should
work the same way, with one addition — the levels are ordered, so the intersection is the lower of
the two.

Asking downwards is worth having: something that needs no privilege can say so, and be held to it.
Asking upwards is the thing that must not work, and a cap in the composition is what stops it.

**Where the cap lives matters more than it first appears.** For a plugin the user installs, the
platform's model today is that the consent dialog *replaces* the composition's grant — the entry
declares, the user agrees, and that is the grant. If the level rode along on that mechanism, then
whoever can write the catalogue could confer unrestricted embedding, and unlike a capability it
would take effect before any dialog exists, because the level decides how the frame is created in
the first place. So the cap belongs to the composition and applies to a catalogue as a whole; the
entry proposes within it.

**A request above the cap is refused, not demoted.** Silently running an application below what it
declared it needs produces a failure nobody can trace back to a configuration line. The platform's
own error taxonomy already prefers a loud misconfiguration to a silent no-op.

**The level is not revocable, and that is not an oversight.** The contract already carries one
capability that is deliberately not offered as a switch — the right to contribute — because
withdrawing it would change nothing while appearing to. The level is the same shape for the opposite
reason: withdrawing it changes everything. It does not reduce a plugin, it breaks it, and a user is
not in a position to judge that trade. It is therefore shown rather than asked about, and shown
prominently, because it is the most consequential fact about an entry.

Decided now rather than later because the cap cannot be retrofitted. Once a level is a field that
takes effect on the strength of the entry alone, every catalogue is a hole.

### The workbench tells a surface when it is not being shown

A frame cannot work this out for itself: the browser's visibility notion follows the window, not
whether the workbench is displaying that surface. So a surface the user switched away from believes
it is visible and keeps its timers running.

This is what makes the user's rule workable — long-running work belongs in the backend, and the
interface restores its state when it returns. Without the signal the only way to stop a hidden
application working is to destroy it, and destroying it means a full bootstrap on every switch,
which is why retention exists in the first place. With the signal, retention keeps *state* while the
application itself winds down, and a well-behaved first-party application is a reasonable
expectation. For a plugin nobody vouches for it is not, and destruction remains the answer there.

Added now rather than later because the pushed surroundings are a fixed vocabulary: a field added
afterwards is a field every existing plugin does not know about.

### The vocabulary separates the mechanism from the level

"Sandbox" stops naming the mechanism and names only the strict level, where it is exactly right and
matches what the browser calls it. The mechanism — a plugin that runs in a frame and reaches the
contract over a channel — gets a neutral name, and the levels sit underneath it.

The expensive part is that this renames a published package and the well-known path its documents
load from. Four documents in this repository hardcode that path and nothing outside does, so this is
the cheapest it will ever be. Carrying the wrong name forward costs more than the rename does.

### The asset kit is renamed, not split

Splitting it along the line that suggests itself — the channel transport for everyone, the element
family for those who want our look — was considered and rejected. The transport is 11 KB and every
frame document loads it; the elements and their stylesheet are 159 KB together and only some do. But
a document only fetches what it asks for, so the unused part is never downloaded, and the only cost
of one package is that a distribution copies three files instead of two.

Against that: two version lines to keep in step, and two asset globs that would both have to resolve
into the same directory, because the contract is a single well-known path that documents hardcode.
Two packages and one mount point is more fragile, not less.

The need that argument keeps circling is a different one, and it is additive rather than a split: an
application with a bundler wants an installable, typed client, not a global script from a magic
path. That is a new package when there are consumers to shape it, and a new package breaks nothing.

## Risks / Trade-offs

- **Fault isolation turned out to be Chromium-only, and the recommendation was rewritten rather than
  hedged.** → The sibling subdomain is now recommended for the properties that hold in every engine,
  with process separation named as a Chromium bonus. What this costs is honesty about a selling point
  the change no longer has: on Firefox and Safari a frozen team application still takes the workbench
  with it unless the product pays for a cross-site origin.
- **The permissive level is a privilege the platform cannot take back.** → Which is why it is never
  self-declared, and why the guide says plainly that an embedded application is trusted code. The
  platform's honesty is the mitigation; there is no mechanism that would be.
- **Under one origin, teams share storage and a background worker.** → Two mitigations belong to the
  serving layer, not to us, and the guide should say so: the header that would let a worker widen its
  scope beyond its own path is simply never passed through, and storage keys are prefixed per
  application by convention. Neither is enforceable by the workbench, and pretending otherwise would
  be the same defect this change is fixing.
- **Renaming breaks every plugin document.** → Four of them, all in this repository. The alternative
  is keeping a name that misleads for as long as the platform lives.

## Open Questions

- **Whether the capability file is renamed to match.** A delta cannot move a capability, so the
  contract file keeps its path through this change. Renaming it is a separate mechanical step, and
  it is worth doing only if the vocabulary change lands.
- **Whether an installable client for bundled applications is wanted**, and what it should carry.
  Deferred deliberately until there is an embedded consumer to shape it; it is additive whenever it
  comes.
- **Whether the origin-keying header belongs in our guide.** It is a deployment concern rather than a
  platform feature, but it is the difference between a frozen team application taking the workbench
  with it and not — which makes it hard to justify leaving out.
