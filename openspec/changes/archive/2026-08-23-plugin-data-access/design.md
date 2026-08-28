## Context

See proposal.md — Why. What follows was verified against the published contract
(`@loom/plugin-sdk` and `@loom/shell` at 0.5.47) and against the running demo, rather than recalled,
because the value of this entry is that whoever picks it up starts from facts instead of from an
impression.

**The capability set names slices of one object.** There are six — `contributions`, `ui`, `host`,
`navigation`, `session`, `theme` — and the contract's own wording is that each names a slice of the
plugin's context. That is a coherent model, and it is exactly why data access falls outside it:
none of the context's members fetches anything, so there is no slice to name and nothing for the
broker to intercept.

**No capability speaks to a backend for this.** Three mention a backend at all —
`persistence-ports`, `access-gating` and `platform-composition` — and all three mean the workbench's
own state or who is signed in. None concerns a product's domain data, and nothing anywhere gives a
plugin a way to obtain a token, a scope or an identity it could present to an API.

**The platform ships no server, by decision.** Whatever is decided here, the platform's share of it
can only ever be a seam and a model. The thing that would enforce anything lives in the product.

## What the levels actually reach

Measured, not inferred. The demo's payment plugin is the only isolated plugin in existence, and it
reads a file the demo serves with `Access-Control-Allow-Origin: *`. Asked with `Origin: null` — what
an opaque origin sends — production answers `200`. It works because the data is public: anyone can
fetch it with no session at all. That is not a property of the demo's data, it is the only shape in
which an isolated plugin obtains anything.

| level | what its requests carry | what it can obtain |
|---|---|---|
| in the application's context | the application's origin, its cookies, anything in its memory | whatever the signed-in person may reach |
| embedded | the origin its document was served from, and that origin's cookies | whatever that origin is granted |
| isolated | no origin of its own, no cookies | only what a service releases to any caller |

**A separate deployment is not a separate origin.** Routing a sub-path to another application
server — a reverse proxy in front of several deployments, the pattern a first-party product is most
likely to already have — separates operations completely and privilege not at all. The browser never
learns that a second server answered; the document's origin is the address in the bar. Such a plugin
shares the application's storage, can reach the hosting document and carries its session. For code
the operator wrote that is exactly right and pleasantly cheap. For code they did not write it is the
one arrangement that must not be chosen, and the reason is easy to miss precisely because the
deployment separation looks so thorough.

The level that *is* a separation — the plugin's document served at a sibling address, so it holds
its own origin and storage while a cookie scoped to the shared domain still reaches it — is
available to a plugin composed with the application, which names its own address. It is not
available to one installed at runtime: the store requires an installed plugin's document to be
served from the application's own address. So for installed plugins the two ends exist and the
middle does not.

## What is decided

**Data is never handed to a plugin.** From the user, not from this analysis:

> A plugin that needs data fetches it from the backend, and the API's security model is what grants
> it access to particular things.

Its corollary is the reason this entry exists: not as part of a bundle, not as a build-time
snapshot, not pushed across the host boundary. A plugin that is fed cannot be restricted afterwards,
because feeding it removes the place where restriction would happen. The distinction survives even
when the thing being fetched is a static file, which is why the demo fetches one.

**No seam is built, and the platform says what is true instead.** The three statements the proposal
lists are the delta. They are not a decision to stay out permanently: they are the accurate account
of a platform that has no data seam, written so that the absence is legible rather than discovered.

**A future seam carries requests, not credentials.** Recorded below, because the decision that it
would take that shape is worth keeping even though the building of it is not scheduled.

## The shape a seam would take

**The axis that matters is not "the plugin calls" against "the host calls". It is "a URL" against "a
name".** A seam shaped as `fetch(url, init)` is a proxy around the browser's cross-origin gate, with
the application's own reach, aimed wherever the plugin points it. It would also force the platform to
judge addresses, which is a domain it is not allowed to know. A seam shaped as `request(name,
payload)` inverts both: the plugin names something, the *product* decides what the name means and
whether this plugin may say it. The platform transports an opaque string and a data object and
interprets neither — the posture `access-gating` already takes for roles, which it matches and never
reads.

Almost everything else follows from that choice:

- **Telling one plugin's request from another's.** The host attaches the identity; the plugin never
  states it. It is already known, because the channel belongs to exactly one plugin. This is the
  strongest argument against the plugin calling for itself: a sender-supplied sender is not an
  identity.
- **Whether it is a seventh coarse capability.** With named requests the permission has a parameter —
  not *may it reach the network* but *which requests may it make* — which answers the objection that a
  permission able only to say yes is worse than none. The fine part is declared by the product and
  the plugin, so the platform stays domain-free.
- **Where a grant lives.** Nowhere new; it is more of what the permission model already holds.
  Whether it can be asked for at the point of use stays with `just-in-time-permissions`.
- **What can be said about a plugin in the page.** Nothing, and honestly: it can bypass any seam
  offered to it. The guarantee is about the seam — a request through it carries the plugin's identity
  and is refused without the grant, at every level — beside the plain statement that the workbench
  claims no containment for a plugin running in its own context.

**The cost, stated plainly.** A brokered path crosses the boundary as cloned data: no streaming, no
progress, no cancellation, binaries copied whole, every response resident on the host side once.
Fine for lists and forms, wrong for a download. And the workbench becomes a conduit for traffic it
has no opinion about — mitigated only by the fact that it does not touch it: the product's own
implementation is the call.

**Two problems wear one hat.** Reaching *the product's own* API is a question about passing on an
identity the user already has, and we design both ends. Reaching *someone else's* API is a question
about a secret that has to live somewhere, and we are a guest in rules we do not set. They deserve
different answers, and conflating them is how a design ends up handing a plugin a long-lived key
because that was the only shape that covered both.

**The principle to measure any answer against: a plugin receives capabilities, not credentials.**
Ordered from worst to best — a secret inside the plugin, a long-lived token inside the plugin, a
short-lived narrowly-scoped token, and nothing at all because the request is made on its behalf. The
further right, the less the plugin has to be trusted, which is the whole reason it is in a frame.

**Four shapes, and what each is for:**

| | Who holds the secret | What the plugin receives | Fits |
|---|---|---|---|
| Pass the secret through | ultimately the plugin | the key itself | almost never — only where the secret is the plugin's own and the user chose that knowingly |
| Exchange it for a token | the backend | a short-lived token, scoped and addressed to this plugin | the product's own API; the API enforces, and a leaked token is narrow and soon dead |
| Broker an authorisation | the backend | a token for one provider, with the scopes that were asked for | a third-party API that speaks a delegation protocol |
| Ask on its behalf | the backend, exclusively | nothing — it asks, the backend calls | a third-party API with a static key, and anything the browser could not call directly anyway |

**Storing a secret encrypted buys less than it appears to.** It protects a leaked backup. It does
not help if the workbench decrypts the value in the browser to hand it over, because from that point
it sits in the memory of the component we least trust. The gain begins only where the secret never
leaves the backend in readable form. Note also that this platform is already committed to not being
a secret store — where such a value lives is the product's question, and ours is only what leaves
that place, and in what form.

**A lever specific to the isolated level.** The usual objection to handing out any token is that a
plugin can send it wherever it likes — through a request, a beacon, an image, a form. All of those
are governed by a content policy, and the distribution serves an isolated plugin's documents itself.
Serving them with a policy generated from what the plugin declared it needs to talk to turns "a
token given out is potentially public" into "a token usable only against the origins that were
declared", enforced by the browser rather than by our goodwill. Note that the declaration the
contract carries today says where a plugin's *documents* may be served from, not where it may
*connect to*; the lever would be a sibling of it, not the same field. It does not exist at the
embedded level, where the application shares the hosting origin and its policy.

**Where a secret would be maintained.** The workbench already draws a plugin's settings from a
declaration, stores the values itself and tells the plugin what they are. A secret would be the one
kind where that last clause is inverted: written in, stored through the port, and never returned —
the plugin learns only that something is set. That makes "the plugin does not know its own secret" a
property of the platform rather than a request to the plugin's author.

## Findings recorded, not acted on

**The contract documents a claim bag as reaching plugins, and it does not.** The published session
snapshot describes its free-form claims as carried through to plugins that read the session. Neither
the plugin context nor the state pushed to an isolated surface carries it — both stop at the
sign-in state and the roles. The behaviour is the right one and is now held by a requirement; the
sentence describing it is wrong and is a one-line correction to the published contract, taken
separately.

**The middle level is unreachable for an installed plugin.** Because the store requires an installed
plugin's document to be served from the application's own address, such a plugin runs either with no
origin or with the application's own. The sibling-address arrangement, which is the only one that
separates and keeps the session, is open to composed plugins alone. Worth building the day someone
needs it; there is no such consumer, and widening what an installed plugin's address may be is a
security decision that should be made for a real case rather than for symmetry.

## Why the scope is drawn where it is

**No server is in scope, because none is shipped.** A product implements the API and its security
model. What could be in scope is the seam a plugin reaches it through, and the model that describes
what reaching it means.

**Asking the user is out of scope**, and belongs to `just-in-time-permissions`. Whether a data
capability could be granted at the point of use is a question about a capability that does not
exist.

**Treadle is out of scope**, as everywhere: it is not built, and specifying a data path through a
component with no repository would be specifying a wish.

## Open Questions

None blocking. What would reopen this is a single fact: a plugin that is not composed with the
product and needs data the product does not release to everyone. At that point the shape above is
the starting point, and it should be built against that plugin rather than against a guess.
