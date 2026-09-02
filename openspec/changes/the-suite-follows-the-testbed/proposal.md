> **Status:** approved.

## Why

The nightly testbed suite has failed on two consecutive nights, and twelve of its tests fail
deterministically on `main`. None of the twelve reports a defect. Each one asserts something the
testbed distribution or the shell deliberately stopped doing, and the suite was never brought along.

A suite that is red for reasons nobody has to read is a suite nobody reads. It cannot report the
regression it exists to catch, because a thirteenth failure would arrive in a list of twelve that
are already expected. The suite runs outside the merge gate by decision, so nothing else stands in
front of these regressions; restoring it to green is what makes the nightly a signal again.

## What Changes

Three groups of stale expectations are brought in line with what the testbed and the shell do now.
The suite gains no coverage and loses none: every test keeps the behaviour it was written to pin.

- **Nine tests around the sandboxed iframe surface** assume the sandbox opens as one more tab beside
  whatever was already open. The testbed now ships a workspace that claims the sandbox address, and
  the workspaces contract requires a claimed address to activate the workspace that claims it. That
  workspace declares a single non-closable tab, so the neighbouring tabs those tests reach for are
  gone by design. The tests are rewritten to work inside the sandbox workspace, or to reach the
  sandbox at an address no workspace claims where the scenario is about neighbouring tabs.
- **Two app reset tests** wait for a confirmation button named `OK`. The generic confirmation was
  replaced by a dedicated app reset dialog whose confirm button carries the action's own name and a
  stable test id. The tests are pointed at that dialog.
- **One workspaces test** expects five provided workspaces where the testbed now ships six. The
  expectation is derived from the distribution rather than restated, so that the next workspace the
  testbed gains does not break it again.

Nothing in the platform changes. The testbed weaver gains a command and a title, because the
distribution's own fixtures are what the tests drive; the shell is untouched. If any of the twelve
turns out to rest on a shell defect rather than on a stale expectation, that test is left failing and
the defect gets its own change naming the requirement it fails.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No guarantee changes: the behaviour these tests now meet is the behaviour the capabilities
already require, and the workspace claim in particular is `workspaces` working as specified. The
change declares `skip_specs: true`.

## Impact

Test sources, all under `platform/apps/loom-testbed-e2e/src/`:

- `sandbox.spec.ts` — three tests
- `surface-retention.spec.ts` — five tests
- `pane-focus-drag.spec.ts` — one test
- `app-reset.spec.ts` — two tests
- `workspaces.spec.ts` — one test

Two fixture files carry the added address, `apps/loom-testbed/public/sandbox-rpc/plugin.js` and the
testbed weaver's command, title and content entry. Neither is platform code.

The behaviour each group meets was set by three merged changes, kept here so the reasoning stays
findable: the testbed's sandbox workspace and its claim arrived with `a-deep-link-waits-for-the-plugin-that-answers-it`,
the dedicated app reset dialog with `stored-state-is-read-not-rewritten`, and the sixth provided
workspace with the same change that brought the claim.

No published package, no consumer-visible surface and no pipeline definition is touched. The
`Nightly` workflow is unchanged; the end-to-end suites stay out of the merge gate.
