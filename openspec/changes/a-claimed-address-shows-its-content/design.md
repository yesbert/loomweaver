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

**The root cause was established first, and it was neither seam this design named.** The rule
written here, that a refused claim means the stash and no claim means the workspace layout, did not
fit what the instrumentation showed, and is left standing as the wrong guess it was rather than
quietly replaced.

What the instrumentation showed: both paths mount the surface correctly. On arrival, and only there,
the pane tree afterwards hydrates from stored working state and evacuates the entire content dock,
which moves in-use retained surfaces into the holding area. Evacuation exists so a retained surface
survives an arrangement being swapped, and it relies on the new arrangement re-mounting the surface.
Where hydration produces an arrangement that renders identically, no host re-mounts, and the surface
is left in the holding area.

So the fault is a half-finished pair: evacuation has no matching return, and the host that owns the
surface is never told its nodes were taken. The fix completes the pair. The stash announces an
evacuation the way it announces every other change, and a retained host that finds its nodes
elsewhere puts them back.

**The return is deferred by one task, and that is not a detail.** An eager return runs inside the
very swap the evacuation exists to survive: it put a docked surface back into a sidebar that was
about to be destroyed, and the surface lost its state. Deferring by one task lets the swap finish, so
a host that was re-created has already re-acquired, a host that was destroyed no longer holds a
mount, and only a genuinely stranded surface is left to repair.

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
