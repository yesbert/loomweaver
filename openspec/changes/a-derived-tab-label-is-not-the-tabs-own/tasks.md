## 1. The defect is pinned before it is fixed

- [x] 1.1 Not needed, and that is a finding rather than a shortcut. The testbed already has the
      pair: `testbed.home` answers the bare address and `testbed.sandbox` declares a tab at
      `sandbox-rpc`, which a sandboxed frame plugin registers later. What was missing was the
      sequence, not the fixture. Reaching the workspace by clicking finds the route already
      registered and stamps the correct title, which is why the suite never noticed; a cold deep
      link to `/sandbox-rpc` followed by a reload stamps `testbed.home.title` and reproduces the
      defect exactly. Nothing was added to the distribution.
- [x] 1.2 Add an end-to-end test that opens that workspace, reloads, and asserts the stored panes
      still hold the tab with no label, and that the strip shows the tab's own content once the
      plugin has registered.
- [x] 1.3 Add a test at the projection level that a tab whose address has no declaration derives
      nothing from a surface at the bare address.
- [x] 1.4 Run both against the code as it stands and record what they report. A test that has never
      been red proves nothing here, because the symptom is a label that looks plausible.

## 2. A derived label stops being stored

- [x] 2.1 Carry the provenance of a label on the projected tab, set where a carried label is laid
      over a derived one.
- [x] 2.2 Store a label only when the tab carried it. Leave everything about how a label is chosen
      and shown as it is.
- [x] 2.3 Check the paths that write a tab without going through the projection, if any exist, so
      the rule holds at every writer rather than at the one this defect came through.

## 3. The bare address stops lending its label

- [x] 3.1 Where a label is derived, ignore a declaration whose address is the bare one unless the
      tab's own address is the bare one too.
- [x] 3.2 Confirm the tab then falls through to showing its address, which the capability already
      requires, rather than to an empty label.
- [x] 3.3 Leave route matching alone, and check that the surface at the bare address still owns the
      addresses below it: the routing suite covers the owned remainder and should stay green.

## 4. Stored panes repair themselves

- [x] 4.1 Extend the repair pass that already runs as panes load: a tab the active workspace
      declares loses a stored label, because such a tab never carries one of its own.
      That rule was too wide, and the suite caught it: `workspace-definitions` went red because a
      declared tab *can* carry a legitimately refined label, and the testbed's review workspace has
      one. Measuring the two forms separated them cleanly. A refined label is stored as a literal
      (`"title":"E-01","literalTitle":true`); a stamped one is stored as a translation key
      (`"title":"insights.dashboard.title"`, no `literalTitle`), because it was copied from a
      route's declaration. The rule is now narrowed to a declared tab carrying a non-literal label,
      which strips the stamp and keeps the refinement.
- [x] 4.2 Fold the drop into the message that pass already writes in development, rather than adding
      a second one.
- [x] 4.3 Leave a label on a tab the user opened untouched, and pin that with a test, since it is the
      guarantee this change is defending.
- [x] 4.4 Verify against a profile carrying the stamped tab, by replaying stored panes into a clean
      profile rather than by reproducing the corruption again.

## 5. It is verified where it was reported

- [x] 5.1 Run the tests from group 1 and confirm they now pass for the right reason.
- [x] 5.2 Reproduce the original report against the demo with a locally packaged shell: open the
      payments workspace, reload, and confirm the stored tab keeps no label and the strip names
      Payments.
- [x] 5.3 Check whether any of the nine long-standing red testbed tests around sandbox surfaces and
      workspaces share this restore path, and say plainly which do and which do not.
      None of them do. Run serially, their failures are a split-handle count, an iframe sub-tab that
      is not selected, a tab class, five click and fill timeouts inside an iframe, and a workspace
      dialog's text. That is a sandboxed-iframe interaction family, not a stored-label one, and it
      predates this branch untouched. One further test, `sandbox.spec.ts:13`, appears red only in a
      parallel run and passes serially; it is a flake, not a tenth failure.
- [x] 5.4 Run lint for every project in all three workspaces, the unit suites, the six guards, and
      `openspec validate --all --strict`, after the last edit rather than before it.
