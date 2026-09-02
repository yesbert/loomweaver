## Context

See proposal.md, *Why*. What is established, and what is not, matters more here than usual, because
this change starts from a symptom rather than from a decision.

Established by observation against the testbed on `main`:

- Opening the application directly at the claimed address leaves the surface's container with
  `display: none`, parented to `body`. That is the shape a surface has while it is parked in the
  retention stash.
- Reaching the same address from inside the application parents the same surface inside
  `lw-content-area`, at full height.
- The tab is present and selected in both cases, and the workbench reports the surface as the active
  content in both cases. Only the mounting differs.

Not established: which side of the seam is at fault. The retention stash decides when a parked entry
may be claimed by a pane, and workspace adoption decides when the panes for an adopted workspace are
laid out. A surface left parked while its pane exists is consistent with either the stash refusing a
claim it should allow, or the layout running before there is a pane to claim into.

## Goals / Non-Goals

**Goals:**

- Meet the guarantee already written: an application opened at a claimed address shows the content
  within the claiming workspace.
- Establish the root cause before changing anything, and record it, so the fix is at the seam that is
  wrong rather than at the one that is easiest to reach.
- Leave the two failing end-to-end tests exactly as they are. They pass when the defect is fixed, or
  the defect is not fixed.

**Non-Goals:**

- No change to what claiming means. `workspaces` is met, not amended.
- No change to the testbed's workspace or its claim.
- No broadening into retention in general. Only the arrival path is in scope.

## Decisions

**The root cause is established first, and the fix follows it.** The two candidate seams are the
retention stash's claim rule, in `libs/core/shell/src/lib/regions/pane/retention/`, and the path that
lays out an adopted workspace, in `libs/core/shell/src/lib/workspace/`. The decision rule: instrument
both paths on the same navigation and compare the order in which the pane appears and the claim is
attempted. If the claim is attempted and refused, the stash is at fault. If no claim is attempted,
the layout is.

The alternative, patching whichever side makes the tests green, is rejected. Both sides can be made
to produce a mounted surface, and only one of them is the place where the rule is actually wrong.

**The fix is covered by a unit test at the seam, not only by the end-to-end tests.** The two failing
end-to-end tests are the proof that the symptom is gone. They are slow and they run nightly, so they
are not where this is pinned for the next reader. A test at whichever seam turns out to be at fault
states the rule directly.

**The `retain` and `subRoutes` question is settled here, in whichever direction the evidence points.**
The workbench warns that a surface declaring both cannot render sub-routes, because a retained surface
mounts outside the router. One of the two failing tests pins sub-route navigation inside exactly such
a surface, and it passed until the claim was added. So either the warning overstates and the
combination works, in which case the warning is corrected, or the warning is right and that test pins
something unsupported, in which case the test and the testbed's declaration change together. Deciding
this is part of the change because the fix cannot be written without knowing whether a retained
surface is expected to see the router at all.

## Risks / Trade-offs

**The fix mounts the surface but loses the sub-route it was deep-linked to.** → The first of the two
tests asserts the sub-route, not merely that something rendered, so a fix that shows the root instead
fails it. That is the intent; it is why the test is not being relaxed.

**Touching the retention stash reaches every retained surface, not only sandboxed ones.** → The
existing retention suites cover the warm paths and stay untouched, so a regression there shows up in
the unit tests rather than nightly. If the root cause turns out to be in the stash, the change adds
the arrival path to those suites rather than testing it only through the testbed.

**The root cause turns out to be neither seam.** → Then the investigation says so and the change is
revised before anything is written, rather than the fix being forced into the shape this design
guessed.

## Open Questions

None that can be deferred. The root cause and the `retain` plus `subRoutes` question are both settled
by the first task, before any code is changed, because both shape what the fix may assume.
