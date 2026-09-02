## 1. Establish the cause before changing anything

- [ ] 1.1 Reproduce the defect from a clean profile and record it: open the testbed directly at the
      claimed sandbox address, and capture that the surface's container is parked, `display: none`
      and parented to `body`, while the tab is selected and the workbench reports it as active
      content.
- [ ] 1.2 Instrument the same navigation on both paths and compare the order of two events: the pane
      that should hold the surface appearing, and the stash being asked for the parked entry. Record
      which happens, in which order, on arrival and on in-application navigation.
- [ ] 1.3 Name the seam at fault by the rule in design.md: a claim attempted and refused means the
      stash, no claim attempted means the workspace layout. If it is neither, stop and revise the
      change rather than proceeding.
- [ ] 1.4 Settle whether a retained surface is expected to see the router, and so whether the
      workbench's boot warning about `retain` with `subRoutes` is correct or stale. Record the answer
      and what it implies for the fix.

## 2. Fix it at the seam that is wrong

- [ ] 2.1 Write a failing unit test at that seam that states the rule directly, before the fix.
- [ ] 2.2 Make it pass, changing only the seam named in 1.3.
- [ ] 2.3 Act on 1.4: correct the warning, or change the testbed declaration and the test that pins
      the unsupported combination. Do whichever the evidence supports, not both.

## 3. Confirm it from the outside

- [ ] 3.1 Run the two end-to-end tests left failing by `the-suite-follows-the-testbed` and confirm
      they pass unchanged. Do not edit them.
- [ ] 3.2 Run the whole testbed suite and confirm it is green, which it has not been since the claim
      was added.
- [ ] 3.3 Run the unit suites, lint and the structure guard, and confirm the retention coverage that
      already existed is untouched.
