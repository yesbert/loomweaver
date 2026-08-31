## 1. Pin the defect before touching it

- [ ] 1.1 Add a content-router test that boots at an address whose route is not yet registered and
      asserts that no navigation failure is reported, then registers the route and asserts the
      address is honoured. It must fail against today's code.
- [ ] 1.2 Add a test that boots at such an address while the workspace claiming it is already the
      active one, and asserts the workspace's saved arrangement is unchanged: no tab for the
      starting address, and the declared tab still active. It must fail against today's code.
- [ ] 1.3 Record both failures in the change before any fix, so it is on the record that the tests
      pin the defect rather than the fix.

## 2. Let a pending address land

- [ ] 2.1 Carry a placeholder route for the pending boot address in the route table the initial
      navigation runs against, so the navigation matches and completes.
- [ ] 2.2 Retire the placeholder when the route table changes, so the real content wins the moment
      the plugin registers, and add a test for exactly that hand-over.
- [ ] 2.3 Confirm that an address which is never answered reads as unavailable rather than as a
      blank screen, and that the existing rule holds: once the user navigates away themselves, the
      pending address is abandoned.

## 3. Keep fallback content out of the arrangement

- [ ] 3.1 Mark the navigation the workbench performs because it could not answer an address as its
      own fallback, distinct from a destination the user or the product chose.
- [ ] 3.2 Refuse such a navigation entry into the active workspace's tabs at the point a navigation
      becomes a tab, and verify that a user who later navigates to the same address themselves still
      gets a tab for it.
- [ ] 3.3 Verify nothing non-closable that the user cannot get rid of is left behind when an address
      cannot be answered.

## 4. Answer the design's open question

- [ ] 4.1 Check whether the pop-out window path, with its own guard and its own boot address, has
      the same hole. Apply the same fix there if it does, and note the answer in the design.

## 5. Close the loop

- [ ] 5.1 Run the platform unit tests and lint.
- [ ] 5.2 Reproduce the original user path end to end against the demo: leave the session in the
      claiming workspace, cold start at its address with the plugin entry held back, then switch
      away and back through the launcher rail, and confirm the workspace is reached.
- [ ] 5.3 Confirm the saved arrangement after that run carries only the workspace's declared content.
