## Context

See proposal.md — Why. The state that shapes the approach:

A weaver generated with a command already emits it reachable by a caller that is not the user, with a
description, which is exactly what an agent needs to be offered one. The generator derives permissions
from the features asked for rather than taking them as input, so a new feature can carry its own
permission without widening anything by hand.

Every route a consumer uses derives from one description of the generator, and the routes differ only
in what they are handed: the Nx route gets the workspace and may change files in it, the command line
gets a directory, the assistant route gets nothing and returns a file map. What generated output needs
from the workspace around it is already expressed as data — a list of amendments, each an "ensure this
is present" that changes nothing when applied twice and never overrides a value the consumer chose.
Four kinds exist; none of them is a package.

The shape being generated is not speculative. `demo/src/agent` runs it: a panel, a runner emitting
genuine protocol events including argument deltas, the adapter in the middle, a confirmation that
declines, and tests. What has never been generated is that shape with its scripted brain taken out.

Whether generated output actually runs is answered nightly rather than at merge: a check installs the
published packages into a fresh application, follows the quick start and asserts on what is served.

## Goals / Non-Goals

**Goals:**

- One choice at generation time produces something that runs, demonstrates itself and is then
  replaced in one place.
- The generated code teaches the three things that are easy to get wrong by doing them, not by
  explaining them.
- The package the output needs is handled by whichever route can, as data, reusable by any later
  generator that needs one.

**Non-Goals:**

- Not making the adapter less headless. It keeps bringing no transport, no interface and no agent;
  what changes is that a consumer's project can be generated with those parts already shaped.
- Not generating a product's agent. The stand-in is a stand-in, and the design's job is to make
  replacing it a one-file change rather than to make it good enough to keep.
- Not reconciling the demo with the template. They share no code, as no template does, and they are
  allowed to differ.
- Not changing what an agent may reach, which is decided by the command seam and unchanged here.

## Decisions

**The agent connection is a feature of the weaver generator, not a generator of its own.** The two
compose: the command the weaver already emits is the thing the connection offers, so asking for both
gives a chain that can be exercised end to end on the first serve. Permissions are derived where the
features are, so the permission comes with the choice for free.

*Alternative rejected:* a generator of its own, run against an existing weaver. It would have to find
the plugin to add to and edit it, and the rule for that is already strict: a generator composes into a
file only while that file still presents the shape the platform generated, otherwise it must leave it
alone and name what to add. An agent generator would therefore fall back to naming its own wiring
often enough to be a worse experience than the one it replaces. The recipe is one function producing a
file map, so exposing the same output as its own scaffold later is cheap; that is not a reason to do
it now.

**Asking for the connection also produces a command.** A connection that offers nothing demonstrates
nothing, and a freshly generated distribution carries nothing an agent could reach on its own. So the
choice implies the command feature, the way another feature already reshapes the surface it is asked
about rather than producing an inert one.

*Alternative rejected:* an empty panel explaining that nothing is offered yet. It is honest and it
teaches nothing, which fails the point of generating this at all.

**The stand-in produces the protocol's events; it never reaches for the command itself.** That is the
whole value: the path from the offered list, through a start, argument deltas and an end, to an
outcome, is the part that is easy to get wrong, and a stand-in that shortcut it would prove nothing.
It is a tool picker, not a brain: it shows what is offered and runs one on request.

*Alternative rejected:* generating nothing to look at and leaving the consumer to bring a transport
before they can tell whether their wiring is right. That is today's experience, and it is the reason
this change exists.

**The stand-in is a single file the panel does not know about.** The panel talks to the connection;
the connection takes events from whoever hands them over. Replacing the stand-in with a real transport
is then a one-file change with nothing else to unpick, which is what the specification requires.

**The generated connection keeps no module-level state.** The demo's runner holds the context and the
tools in module variables, which is fine for one instance in one demonstration and wrong in a
template: a second weaver generated the same way would share them. The generated form is a factory
returning what it offers, as the published recipe already shows.

**A package the output needs becomes a new kind of amendment.** It says what must be present, not what
to set; the route with workspace access records it in the project's manifest, the routes without one
name it among the steps that remain. This is the existing mechanism, extended by one kind, and any
later generator needing a package inherits it.

*Alternative rejected:* naming the install line in the notes beside the generated files. For the route
that can reach the workspace that is a defect against what is already required of it, and it leaves
output that does not compile until someone reads a README.

**The versions live in one place, and a check keeps them honest.** The platform's own packages travel
on one version line, so the adapter is recorded at the generator's own version; the protocol package
is recorded at the range the adapter itself declares as a peer, because two different ranges would
resolve to two copies. Both are stated once in the recipe, and a repository check compares them with
what the platform resolves, so a bump cannot leave the generator behind quietly.

## Risks / Trade-offs

- **A stand-in can be mistaken for a real assistant.** → It says what it is in the panel, where it
  cannot be missed, and in the header of its own file, in the way the generated development sign-in
  already does. Pinned by a requirement rather than left to the wording of the day.

- **Generated interface code is code we have to keep alive, and it is the second panel in this
  repository.** → It shares nothing with the demo's, which is normal for a template and is stated in
  the proposal so nobody reconciles them later. What keeps it honest is the nightly check that
  generates, serves and asserts, extended to reach the panel; a template that stops compiling fails
  there rather than in a consumer's project.

- **Writing into the consumer's package manifest touches a file we do not own.** → The amendment rules
  already cover exactly this: add only what is absent, leave every value the consumer chose, report it
  in the same breath as what was written, and name it in a trial run instead of doing it.

- **The protocol package is pre-1.0 and moves.** → The adapter already declares it as a peer and its
  stability is documented as following the protocol rather than the platform. The generated output
  inherits that unchanged, and the single place the range is stated is what makes a bump one edit.

- **The implied command could surprise someone who asked only for the connection.** → It is named in
  the notes the generator writes and in the specification, and the alternative is a first run that
  offers nothing. A consumer who wants neither can delete the command, which is ordinary generated
  code.
