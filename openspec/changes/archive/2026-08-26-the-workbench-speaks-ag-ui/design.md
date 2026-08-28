## Context

See `proposal.md` — Why. What shapes the approach on both sides:

**What the workbench offers.** `ctx.invocableCommands()` answers a list of entries carrying an id, a
title, an optional description, optional declared arguments and an optional statement of what the
command answers. Every text is already resolved to the active language. The declared argument kinds
are a closed set: text, number, boolean, a choice from a fixed list, and a list of any of those.
`ctx.invokeCommand(id, args)` answers one of three outcomes — answered, refused, failed — and never
throws for a refusal.

**What the protocol expects.** A tool is `{ name, description, parameters }`, where `parameters` is a
JSON Schema object with `properties` and `required`. A call arrives as three events: a start naming
the call and the tool, a stream of argument deltas that concatenate into JSON, and an end. The result
goes back as a tool message carrying `content` and, where the call did not succeed, `error`.

**What moves.** AG-UI is at 0.0.58, unchanged for six days at the time of writing, and its event set
has visibly grown over its life. Anything we write against it will need to follow it.

## Goals / Non-Goals

**Goals:**

- A weaver that wants an agent writes no tool list and no dispatch. It connects a stream and a plugin
  context, and the actions the workbench already knows about are what the agent can reach.
- Keep the platform untouched and un-depended-upon, so that the protocol can move without the
  contract moving.
- Stay framework-neutral, because the contract this consumes is.

**Non-Goals:**

- No transport. Opening a connection, choosing SSE or a socket, retrying, and authenticating are the
  weaver's, and later the product's.
- No user interface. Not a chat, not a message list, not a rendering of anything.
- No agent. The package never decides what to do; it carries what was decided.
- No shared state, no reasoning display, no subagent handling. Those events pass by untouched.
- No brokered channel for an isolated plugin. That is separate work with its own reason to exist.

## Decisions

### The package owns the tool-call loop, with one hook in front of it

The alternative — hand a weaver the pieces and let it assemble them — was rejected because assembling
them is precisely the work that would be written identically in every weaver, and one of the pieces
is a tool list, which is the second registry the previous change existed to prevent.

Owning the loop is only acceptable because the weaver can get in front of it. A hook sees the
assembled call before it runs and may let it through, decline it, or answer it itself. Everything
that needs judgement lives there: a confirmation before a destructive step, a product's own policy, a
tool the weaver would rather serve itself. Without the hook, an owned loop would force every weaver
into one behaviour; with it, the default is the useful one and the exception is a few lines.

### A closed set of kinds becomes a closed piece of schema

Each declared kind maps to one small JSON Schema fragment: text to a string, number to a number,
boolean to a boolean, a choice to a string with an enumeration, and a list to an array of whichever
of those it holds. Required arguments become the schema's required list; each description is carried
across as the schema's description.

This is the whole reason the platform kept its own descriptor rather than adopting JSON Schema
directly. The mapping is a small total function over a closed set — every input has exactly one
output and there is no case to get wrong — and it lives here, where it may follow the protocol's
churn without touching anything guaranteed.

### A refusal is an error, not empty content

The protocol carries one `error` field, and its own documentation gives the reason: without it a tool
that failed is indistinguishable from one that succeeded. The same argument decides this mapping. An
answer becomes content. A refusal and a failure both become an error, worded so that a reader can
tell "it did not run" from "it ran and broke" — the distinction the workbench went to some trouble to
preserve, and one that would be thrown away by flattening both into an empty result.

Where the command declares no answer, the content is a plain statement that it ran, rather than an
empty string. An agent reading an empty string cannot tell it from a tool that returned nothing
meaningful, and will often retry.

### A peer dependency on the protocol's core, not on its client

Everything this package touches — the tool definition, the tool message, the three tool-call events
and the convenience form that carries a whole call in one — lives in `@ag-ui/core`, whose only
dependency is a schema library. The client is the transport layer: it adds observables, id
generation, JSON patching and a binary codec, none of which this package owns by its own
non-goals.

So the peer dependency is on the core. A weaver that builds its own agent installs the client, which
pins the core to an exact version, so the "one copy" property holds either way — but a weaver that
only wants the mapping is not made to install a transport stack to get it.

That choice is what lets the loop be fed rather than subscribed to: the weaver already has the stream,
and hands events in. It keeps this package free of observables entirely, which makes it testable by
calling a function with an event rather than by standing up a stream.

The trade-off is the usual peer one: a consumer installs it themselves and a mismatch is their error
rather than ours to absorb. At 0.0.x that is the honest arrangement, because absorbing it would mean
promising compatibility across versions we have not seen.

### It joins the shared version line, and says what that does not mean

The alternative was a line of its own, on the argument that the package should be free to move when
the protocol moves. It was rejected on cost: a second line means a second path through the bump
script and the publish pipeline, for a signal a sentence can carry.

So the version number says which platform release this package was built against, and the README says
the thing the number cannot: **the stability of this package follows AG-UI, not the platform.** A
break in the protocol is answered by publishing at the next platform version.

### A new Nx scope rather than an existing one

The boundary this package needs already exists under `scope:tooling`: reach yourself and the
published contract, nothing else. Reusing the tag would have cost nothing and enforced the right
thing.

It is rejected because the tag would then be untrue. `tooling` is what runs while you build —
generators, a CLI, a scaffolding server. This runs in the user's browser, in the product, at the
moment an agent asks for something. A reader who sees `scope:tooling` on it would be wrong about when
it runs, and a constraint that happens to fit is not a reason to mislabel the thing it constrains.

### Proven in the testbed, against a scripted agent

The proof is a piece in the testbed that plays a fixed sequence of protocol events and asserts that
the workbench did what the events asked. No network, no model, no key. Everything downstream of the
brain is real: the tool list comes from the live registry, the call runs through the real seam, and
the result carries a real outcome.

That is enough to prove the loop, and the demo — which is where a person watches an agent open a tab
and change a theme — is the next change rather than this one.

## Risks / Trade-offs

- **The protocol moves and the mapping breaks.** → It is one small module against a closed set of
  kinds, and it is outside the guaranteed contract by construction, so following a break is a patch
  to one package rather than a change to the platform. The README says so in advance.
- **An owned loop is the wrong shape for someone.** → The hook is the escape, and it is placed before
  execution rather than after, so a weaver can decline as well as observe. If someone needs less than
  the loop, the mapping and the accumulation are separately usable.
- **The hook becomes a way to widen what an agent may reach.** → It cannot. It runs after the
  workbench has narrowed the list and before the seam, and the seam refuses what it always refused
  whatever the hook says. The hook may only narrow or substitute.
- **A seventh package is more release surface.** → It joins the existing line, so what grows is one
  entry in the bump script and one in the publish pipeline, not a second process.
- **`ctx.invocableCommands()` is read once and the agent's tool list goes stale** as plugins load and
  the session changes. → The list is read when a run is started rather than cached at construction,
  so each run carries what is reachable then. Naming this here because the opposite is the easy
  mistake.

## Open Questions

- Whether a weaver ever needs to offer a tool the workbench does not know about, alongside the
  commands. Deferrable: the hook can already answer such a call, so the question is only whether the
  package should also help *describe* it, and the first real consumer will say.
