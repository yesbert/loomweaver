## Context

See proposal.md, *Why*. What shapes the approach is that the twelve failures have three separate
causes, and only one of them is a simple find-and-replace.

Two facts constrain the nine sandbox failures. The first is the contract: `workspaces` requires that
an address claimed by a declared workspace activates that workspace, and it rules out the exception
that would make these tests pass. "The claim SHALL hold however the address is reached — a link
followed into the application, a restart, a command, a programmatic navigation, a tab a plugin
opened. There SHALL be no exception for an address the user reached from inside the application."
The rail click these tests perform is exactly such an address. The workbench is right and the tests
are wrong.

The second is that the claim is load-bearing. `testbed.sandbox` and its claim on `sandbox-rpc` were
added by `a-deep-link-waits-for-the-plugin-that-answers-it` as the fixture that reproduces a defect
which permanently redirected a workspace. Removing the claim to make nine tests pass would delete
the reproduction of a shipped bug.

The testbed already registers a second sandboxed iframe plugin, `sandbox-static`, whose routable
surface sits at an address no workspace claims. Per the same capability, an unclaimed address "is
shown where the user already is", which is the world the nine tests were written for.

## Goals / Non-Goals

**Goals:**

- Every test keeps the behaviour it was written to pin. The suite ends with the same coverage it has
  on paper today, and green.
- Each rewritten test states which world it is in, so the next reader can tell a claimed address
  from an unclaimed one without running it.
- Expectations that count things the distribution declares are derived from the distribution rather
  than written out as a number.

**Non-Goals:**

- No change to `libs/`. If a failure turns out to rest on a shell defect, it stays failing and gets
  its own change.
- No change to the merge gate. The end-to-end suites stay nightly.
- No new sandboxed plugin. The testbed has two, which is enough to express both worlds.

## Decisions

**The distribution keeps its claim; the tests move.** The alternative was to drop `claims` from
`testbed.sandbox`, which would turn all nine green in one line. Rejected: that claim is the fixture
for an archived defect, and a fixture deleted to silence tests is how the bug comes back. A second
alternative was to give `testbed.sandbox` a neighbour tab so the coexistence scenarios work inside
it. Rejected as less honest: it would make the tests pass by making the claiming workspace look like
an ordinary one, and the scenarios would no longer say which world they are testing.

**Each of the nine is sorted by what it is actually about, not by which file it is in.** A scenario
whose subject is the sandbox surface itself, its deep link into a sub-route, its promotion from a
preview tab, its `beforeClose` veto, its `setDirty` guard, belongs at `sandbox-rpc` and is rewritten
to expect the sandbox workspace. A scenario whose subject is a surface *among neighbours*, opening
beside a dashboard tab, being dragged to an edge, surviving a switch to another tab, needs an
address that does not move the user, and belongs at `sandbox-static`.

**Where a coexistence scenario needs something `sandbox-static` does not declare, extend
`sandbox-static`.** Its surface declares neither `retain` nor `subRoutes`, which the retention
scenarios need. Adding them there is additive and weakens no existing coverage, whereas weakening
the claim removes some. This is the one distribution edit the change permits, and it is confined to
`apps/loom-testbed/public/sandbox-static/plugin.js`.

**The workspace count is derived, not restated.** The failing assertion hard-codes five where the
testbed now ships six. Replacing five with six would fail again the next time the testbed gains a
workspace. The test reads the number of provided workspaces from the same source the distribution
declares them in, so the assertion stays true by construction. The alternative, asserting only that
the tab exists, was rejected because the count is what the scenario is about.

**The app reset tests target the dialog's test id, not its label.** `app-reset-dialog.html` already
carries `data-testid="app-reset-confirm"`. Matching on that rather than on the button's visible text
keeps the tests from breaking again when the label is translated or reworded, which is what happened
here.

## Risks / Trade-offs

**A failure that is a real defect is rewritten into a passing test.** → Each of the twelve is
resolved by naming the behaviour it now meets and pointing at the merged change or the requirement
that set it. Any failure that cannot be traced to one is left failing and reported, not adapted.

**`sandbox-rpc` declares both `retain: 'always'` and `subRoutes`, and the shell warns on every boot
that a retained surface mounts outside the router so its sub-routes will not render.** The retention
sub-route scenario pins behaviour the shell tells the developer not to rely on. → Out of scope here;
the test is brought back to green against current behaviour, and the contradiction between the
fixture and the warning is reported for its own change rather than resolved in passing.

**Extending `sandbox-static` could drift it into a copy of `sandbox-rpc`.** → Only `retain` and
`subRoutes` are added, and only if a moved scenario needs them. The two plugins stay distinguished
by the thing that matters, one address is claimed and one is not.

**The suite is green again and drifts again.** → Not solved by this change. The nightly's failures
have to be looked at when they appear; nothing here makes that automatic, and putting the suite in
the merge gate is out of scope by standing decision.

## Open Questions

None that change the approach. Which of the nine move to `sandbox-static` and which stay at
`sandbox-rpc` is decided per test during implementation, by the rule stated under *Decisions*.
