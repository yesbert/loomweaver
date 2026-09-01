## Context

See `proposal.md` for why. What follows is only the shape of today's code that the approach has to fit.

Restoring a workspace's arrangement filters it against the claims in force now, and the filtered
tree is what the workspace comes up with. Switching into a workspace then asks the restored
arrangement for its active content and navigates there. A workspace with no content of its own
answers with the starting address, and a route guard hands the starting address to whichever
workspace claims it. Those three steps in a row are what turns an empty workspace into an
unreachable one.

Resetting takes no argument and acts on the active workspace. Resetting the application's own
arrangement covers the rail, the panels, their sizes, the user's ordering and the surface instances,
and deliberately leaves every workspace arrangement alone; a test pins that boundary.

The workspace dialog already lists every workspace and already marks the ones that differ from their
baseline, so both the place to show a second mark and the place to offer a per-row reset exist.

## Goals / Non-Goals

**Goals:**

- Restoring reads and reports; it does not write.
- A workspace that has nothing of its own is still enterable, whatever any other workspace claims.
- Repairing such a workspace is reachable without entering it.
- A product can answer for its own users instead of the workbench answering for them.

**Non-Goals:**

- No migration of already damaged stored state. The recognition plus the reset is the repair, and a
  migration would be one more thing writing to stored state on the user's behalf, which is what this
  change is against.
- No reset the workbench performs by itself. The workbench recognises and offers; the user decides.
- No per-workspace setting for the announcement. Settled with the owner: the answer is the same for
  every workspace in practice, and it can be opened later without breaking anyone.
- No change to how claims are resolved or how specific a claim has to be to win. The starting address
  belonging to a workspace is legitimate and stays legitimate.

## Decisions

**Recognition sits where the filtering sat.** The step that today rewrites a restored arrangement
returns a finding about it instead. One place answers "does this stored state contradict the
declarations", and everything else reads that answer. The alternative, working it out again when the
dialog opens, would put the same question in two places and let them drift.

**"Cannot work as declared" is deliberately narrow.** It means: the declaration names content of its
own and the restored arrangement leaves the workspace with none. It does not mean "some part of the
stored state contradicts a declaration". A workspace holding one tab another workspace now claims is
still perfectly usable, and treating that as a fault would turn every redeclaration into an alarm
and would push users to discard arrangements that work.

**Choosing a workspace outranks the address that follows.** When the user picks a workspace, the
navigation that follows is a consequence of that choice, not a request of its own, so it does not
hand the user to another workspace. An address the user actually asks for, typed or followed as a
link, settles exactly as it does today. Two alternatives were rejected. Making the starting address
unclaimable would take a legitimate declaration away from products, and the demo's dashboard uses it
correctly. Not navigating at all on entering an empty workspace would leave the previous workspace's
address in the bar, which the guard then settles on the next tick; the trap would close one step
later instead of not closing.

**The product's setting rides in the workspace declaration as a feature argument**, in the shape
Angular uses for `provideRouter(routes, ...features)` and its `withX()` functions, which is what the
framework's own reference documents for optional provider configuration. The declaration already
takes a variable number of workspaces and a feature object is distinguishable from a workspace, so
no existing call changes. A separate provider beside the existing one was rejected: it is a second
door onto the same surface, and a product that sets it in one place and declares workspaces in
another has two things to keep in step.

**What was recognised is readable as state, not delivered as an event.** The dialog already exposes
which workspaces differ from their baseline; the finding sits beside it. A product reads it when it
wants it, and nothing depends on having been listening at the right moment.

**Resetting takes an optional workspace rather than gaining a second command.** The commands
capability already requires that two resets say which of the two they reset; a third command whose
name differs from an existing one only by "this one" versus "that one" is exactly the collision that
rule exists to prevent.

**The announcement is shown where the emptiness is.** A workspace that cannot work as declared shows
its condition in the content area the user is looking at, with the reset offered there, and carries
a mark in the workspace dialog beside the existing one. The content area is where the user's
question arises, and the dialog is where they go looking once they know something is wrong. The
wording and the visual form come back as a reviewable slice before the rest is built.

## Risks / Trade-offs

- A product relying on the workbench to tidy up silently after a redeclaration now gets the stored
  arrangement back intact → named as a breaking behaviour change in the proposal, and the finding is
  readable so the product can do the tidying itself, deliberately, on its own terms.
- A contested tab stays visible and shows content that today's declaration places elsewhere → this is
  the trade the change makes on purpose. Visible and named beats rewritten and silent, and the user
  can reset. The narrow definition above keeps this from being reported as a fault.
- Suppressing the settlement for the step after an explicit choice could mask a genuine deep link →
  it applies only to the navigation that follows a workspace being chosen, never to an address the
  user asked for. Both halves get a test, including the one that must still settle.
- A per-row reset is easy to hit by accident, sitting next to delete → it confirms first, as delete
  does.
- Already damaged profiles stay damaged until the user acts → true, and it is the point. They become
  reachable and self-explaining, which they are not today, and the escape no longer costs every
  other workspace.

## Migration Plan

No data migration. Nothing rewrites stored state on the user's behalf, before or after this change.
An existing damaged profile is recognised on the next start and repaired by the reset the change
adds, without touching the other workspaces.

Rollback is clean precisely because nothing was written: reverting the update restores the previous
behaviour, and no stored arrangement was changed in the meantime that would have to be undone.

The recorded state at `demo/e2e/fixtures/damaged-payments-workspace.json` is the migration's own test.
It was taken from a real profile after the deep-link fix had already been released, so it is the
state the field is actually in, not a state constructed to pass.

## Open Questions

None that would change the specs, the approach or the task breakdown. The wording of the
announcement and its visual form are settled in the slice named above.
