## 1. Pin both defects with failing tests

- [x] 1.1 Write a shell test: with two workspaces where the second claims `quotes/:id`, opening a
      content tab at `quotes/q-0007` from the first leaves no tab in the first workspace's dock and
      lands it in the second. Confirm it fails against today's code.
- [x] 1.2 Write a shell test: the same open, followed by persistence, writes no tab for that address
      under the first workspace's stored key. Confirm it fails against today's code.
- [x] 1.3 Write a shell test: with a tab active that is not the workspace's declared one, switching
      away and back restores the tab that was active, not the declared one. Confirm it fails
      against today's code.
- [x] 1.4 Write a shell test: a workspace whose stored dock holds a tab for an address another
      workspace claims loads without that tab. Confirm it fails against today's code.
      The harness needed `lw.shell.active-workspace` seeded alongside the dock, or the composition
      overwrites the seed with `{}` before anything reads it. A control seeding an unclaimed address
      guards against the assertion going hollow again.

## 2. The claim settles before the dock is touched

- [x] 2.1 In the content-tabs service, settle the workspace claim before a tab is added, for every
      entry point that reaches the dock (`open`, `keep`, `navigate`).
- [x] 2.2 Sequence the settle so the caller's synchronous `void` call returns immediately and two
      opens in quick succession cannot add their tabs out of order.
- [x] 2.3 Add a test that opens two claimed addresses back to back and pins the resulting order.
- [x] 2.4 Leave `settleWorkspace` in place for addresses that never reach the tabs service, and add
      a test that a boot address still settles.
- [x] 2.5 Tests 1.1 and 1.2 pass.

## 3. The active tab is remembered

- [x] 3.1 Record the active content path into the primary dock's tree when it changes and names a
      tab in that dock.
- [x] 3.2 Confirm a switch restores it through `activeContentPath()` without a second source of
      truth being introduced.
- [x] 3.3 Test 1.3 passes.

## 4. A corrupted dock is repaired when it loads

- [x] 4.1 Beside the structural normalising in the pane-tree storage's `parse()`, add one named step
      that reads the parsed docks against the current workspace declarations and drops content a
      declared workspace claims. One step, not a registry: there is one rule.
- [x] 4.2 Say so once in development mode, naming the workspace and the address, in the style the
      shell already uses for declaration gaps.
- [x] 4.3 Test 1.4 passes, plus a test that the message is absent outside development mode, that an
      unclaimed address is left alone, and that a malformed record is still dropped without a
      message.
- [x] 4.4 Resolve a saved workspace back to the one it came from, so the repair applies to it too.
      The origin is already stored beside the saved workspace, and reading it needs no service, so
      the conservative skip was not necessary. Two tests: a saved copy of the claiming workspace
      keeps its content, a saved copy of another workspace loses it.
      **Residual, deliberate:** a product whose working-state store offers no synchronous read is
      not covered, because resolving the origin there would add a step to the hydration chain and
      three existing tests pin its timing. Such a workspace is left alone rather than wrongly
      emptied.
- [x] 4.5 Keep the delta spec true to what landed: the requirement names dropping, announcing,
      leaving unclaimed content alone, and the silence on malformed records.

## 5. The published surface says what it now does

- [x] 5.1 State on the JSDoc of `openContentTab` that opening a claimed address activates the
      workspace that claims it first. JSDoc on the published contract is the one place a comment
      belongs.
- [x] 5.2 Check whether `docs/authoring-a-weaver.md` describes opening content and would now drift.

## 6. Verify against the reproduction

- [x] 6.1 `nx run-many -t lint test -p shell` green.
- [x] 6.2 `nx package plugin-sdk shell` green.
- [x] 6.3 In the demo, from a clean profile: the assistant's "Open the quote for Nordwind Logistik."
      leaves `pane-trees:dashboard` without a `quotes/...` tab, and clicking Dashboard afterwards
      returns the address to `/`.
- [x] 6.4 In the demo, seed a `pane-trees:dashboard` carrying `quotes/q-0007`, load, and confirm the
      workspace comes up clean with one message in the console.
