## Context

See proposal.md — Why. What shapes the approach is what the catalogue already is, verified rather
than recalled.

**The catalogue is a port, and it is already dynamic.** It exposes a single asynchronous read, and
the built-in implementation fetching a same-origin document is only the convenient case — a product
that implements the port has its backend answer, per tenant if it likes. Nothing about extending a
catalogue at runtime needs inventing.

**But nothing reads it at startup.** It is read when the store dialog opens and when the list of
installed plugins opens, and nowhere else. "Present on the next load" does not exist today.

**An entry already carries almost everything.** Identity, name, the address of its entry document,
the capabilities it declares, and a version used for update detection. What is missing is which
authority stands behind it.

**And the authority is the thing that is missing conceptually.** For a plugin the user installs, the
consent dialog *replaces* the composition's grant — the entry declares, the user agrees, and that
agreement is the grant. Every guarantee about consent, management and revocation was written with
that one arrangement in view.

## Goals / Non-Goals

**Goals:**

- An administrator can put an application in front of every user, with the rights it needs, without
  a rebuild and without asking anyone.
- Withdrawing it is the same act in reverse, and reaches users the same way.
- A user is never confused about why something is there, and never able to break it by accident.

**Non-Goals:**

- **Who an administrator is.** Authentication and authorisation for editing a catalogue belong to
  whoever serves it. The platform reads a catalogue; it does not police one.
- **Per-tenant catalogues.** Already possible through the port, with nothing to add.
- **What level a deployed plugin runs at.** That is `frame-plugin-isolation-levels`. The two changes
  meet at the catalogue entry and must not be decided in one another's terms.
- **Updating a deployed plugin.** The existing update rules are written for what a user installed and
  will need the same subject treatment, but that is a separate pass rather than something to smuggle
  in here.

## Decisions

### Two authorities, named on the entry

An entry says whether it is offered or deployed. That single field is what lets three guarantees keep
their meaning for the case they were written for while stopping short of the case they were not.

The alternative — a second catalogue, one for offered plugins and one for deployed — was considered
and rejected. It doubles the wiring and the failure modes to express something that is one property
of one entry, and it forces an administrator to know which list a plugin belongs in before knowing
whether they want it optional.

### The guarantees get a subject rather than an exception

Consent, management, removal and revocation are not being weakened; they are being told which
plugins they are about. A user's authority over what they chose is untouched, and this change adds
no case where something a user installed becomes less theirs.

That distinction matters for how it reads afterwards. "The user may revoke any capability, except
sometimes" is a contract with a hole. "The user may revoke any capability of a plugin they chose" is
a contract about ownership, and the deployed case is then not an exception but a different subject.

### A lost catalogue keeps what it last deployed

Deployed plugins are load-bearing: an application whose features come from a catalogue is not itself
without them. So the last set that was seen is remembered through the persistence seam the workbench
already uses, and an unreachable catalogue leaves it in place while reporting the failure.

The distinction that makes this safe is **answered** versus **unreachable**. A catalogue that answers
and no longer lists an entry has withdrawn it, and the plugin goes. A catalogue that cannot be
reached has said nothing, and nothing changes. Conflating the two would mean either that a network
blip silently strips an application of its features, or that a withdrawal never takes effect.

### The catalogue becomes a grant-issuing authority, and that raises the stakes

Without a consent dialog in the path, what an entry declares is what a plugin holds. Whoever can
write the catalogue can therefore issue rights. That is not a new hole so much as a much heavier
load on an existing one, and it has two consequences worth stating rather than discovering.

A deployment of this kind should serve its catalogue **through the port, from its own backend**,
where writing it is an authenticated act — not as a static document whose integrity rests on file
permissions.

And it is the argument that turns the cap in `frame-plugin-isolation-levels` from prudent into
necessary: with no consent in the way, a cap that lives in the composition is the only thing between
a writable catalogue and an application that hosts anything at all.

### Startup does not wait for the catalogue at all

The open question was how long to wait for the read before proceeding without it. The answer, from
three findings rather than an estimate, is that waiting buys nothing.

The remembered set arrives **synchronously**: the hydration helper short-circuits whenever the store
can be read without awaiting, which is the case for the device-local default. So on every start
after the first, what the catalogue last deployed is present before the first paint, exactly as the
user's own installations already are.

Arriving late is **safe**, which was the real worry — a deep link into a route a deployed plugin owns
before that plugin has registered it. The content area resolves its surfaces through computed signals
over the registered routes, so a route registered later simply appears. There is no single
"not found" moment to miss.

And there is **precedent**: behind a store that must be awaited, the user's installed plugins already
arrive after the first paint, and the platform tolerates it.

So the startup read is fired and not awaited. The consequence for how this change reads: it does not
give the application a startup *dependency* on the network, only a startup *request*. Once the
application has run once, it is complete without it.

## Risks / Trade-offs

- **The first start a user ever makes has no remembered set.** → Their deployed plugins appear when
  the catalogue answers, a fraction of a second later, and appear correctly because late
  registration resolves. This is the one case where the absence of a wait is visible.
- **A user meets software they did not choose and cannot remove.** → Which is the point, and the
  reason the visibility requirement is not decoration. Something present, unremovable and unexplained
  is how a workbench earns distrust.
- **The install state gains a second set it does not own.** → Today that state is entirely "what the
  user installed", persisted user-locally. The deployed set has a different owner, a different
  lifetime and a different source of truth, and mixing them in one store is how a user's own
  installations start disappearing when a catalogue changes. They stay separate.

## Open Questions

- **Whether an operator may allow user revocation after all.** This change says a deployed plugin's
  permissions are shown and not switchable, which follows directly from the requirement that prompted
  it. What is *not* decided is whether an entry may opt in to being revocable — for an optional
  convenience the organisation deploys but does not insist on. It is additive whenever it is wanted,
  and it should be asked for by a real case rather than guessed at now.
- **Whether a deployed plugin may be turned off temporarily by the user** without being removed, as a
  weaker form of the same question. It is sharpened by an inconsistency this change creates and does
  not resolve: a **composed** plugin can still be disabled and have capabilities revoked, though it
  is just as much software the operator issued. The distinction drawn here is that a composed plugin
  ships inside one artefact the user can see whole, while a deployed one is managed centrally and
  only stays manageable if what was rolled out is actually running. That is defensible, and it is
  not obviously right.
- **What an update to a deployed plugin means.** The existing rules protect a user from a silent
  widening of permissions they consented to. Where they never consented, what the rule protects is
  less obvious, and it deserves its own pass.
