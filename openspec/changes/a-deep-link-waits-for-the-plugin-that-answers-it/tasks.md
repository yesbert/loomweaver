## 1. Pin the defect before touching it

- [x] 1.1 Add a content-router test that boots at an address whose route is not yet registered and
      asserts that no navigation failure is reported, then registers the route and asserts the
      address is honoured. It must fail against today's code.
- [x] 1.2 Add an end-to-end test in the testbed that boots at such an address while the workspace
      claiming it is already the active one, and asserts the workspace's saved arrangement is
      unchanged: no tab for the starting address, and the declared tab still active. It must fail
      against today's code. The testbed gains a workspace claiming the sandboxed surface's address,
      which is the ingredient it lacked.
- [x] 1.3 Record both failures in the change before any fix, so it is on the record that the tests
      pin the defect rather than the fix.

## 2. Let a pending address land

- [x] 2.1 Carry a placeholder route for the pending boot address in the route table the initial
      navigation runs against, so the navigation matches and completes.
- [x] 2.2 Retire the placeholder when the route table changes, so the real content wins the moment
      the plugin registers, and add a test for exactly that hand-over.
- [x] 2.3 Confirm that an address which is never answered reads as unavailable rather than as a
      blank screen, and that the existing rule holds: once the user navigates away themselves, the
      pending address is abandoned.

## 3. Keep fallback content out of the arrangement

Dropped during implementation, with the owner's agreement. These tasks guarded against fallback
content reaching a workspace's saved arrangement. Letting the pending address land removes the
fallback itself, so there is nothing left to refuse entry to. Both spec scenarios the group existed
for are covered by the tests in group 1: the saved arrangement carries only the workspace's declared
content, whether the plugin registers late or never, and nothing unclosable is left behind.

## 4. Answer the design's open question

- [x] 4.1 Check whether the pop-out window path, with its own guard and its own boot address, has
      the same hole. Apply the same fix there if it does, and note the answer in the design.

## 5. Close the loop

- [x] 5.1 Run the platform unit tests and lint.
- [x] 5.2 Reproduce the original user path end to end against the demo: leave the session in the
      claiming workspace, cold start at its address with the plugin entry held back, then switch
      away and back through the launcher rail, and confirm the workspace is reached.
- [x] 5.3 Confirm the saved arrangement after that run carries only the workspace's declared content.
