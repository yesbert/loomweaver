## 1. Pin what is wrong before changing it

- [x] 1.1 Add a failing test in the content-tabs suite: content open in a second pane, an ordinary
      link navigation to it from elsewhere, and the assertion that the pane already holding it takes
      the address and no second copy appears. It fails today.
- [x] 1.2 Add a failing test that an ordinary navigation inside a pop-out window is refused and the
      window keeps its own address. It fails today; the requirement it fails is
      `popout-windows` — *A pop-out cannot stop being one*.
- [x] 1.3 Add the test that guards the fix from overreaching: with nothing open at that address, an
      ordinary navigation opens it where the address is currently carried, exactly as today.

## 2. Reach the copy that is already open

- [x] 2.1 In the tab layer, hand the address to the part of the arrangement already holding the
      content when a navigation is observed that the workbench did not start. The workbench's own
      call keeps doing it before it navigates, per design.md — Decisions.
- [x] 2.2 Confirm 1.1 and 1.3 now pass, and that the hand-off stays a no-op when the address is
      already carried by a part holding the content.
- [x] 2.3 Run the whole content, pane and workspace suites. The first navigation of a session, a
      restored arrangement and browser history all pass through the changed path, so a regression
      shows up there rather than in the new tests.

## 3. A pop-out stays a pop-out

- [x] 3.1 Add a guard on content addresses that refuses in a window opened as a pop-out, deciding
      from the address the window started at, and reporting the refusal to the developer in the same
      words the workbench's own call already uses.
- [x] 3.2 Confirm 1.2 passes, and add the counter-test that the main window navigates normally with
      the guard installed.
- [x] 3.3 Check that nothing else in a pop-out navigates to a content address: the deferred deep
      link and the re-navigation on a session change both run there too, and neither may now be
      refused in a loop.

## 4. Say it once, in one place

- [x] 4.1 `docs/reference/routing.md`: replace the paragraph naming the asymmetry between a link and
      the workbench's own call with the rule that there is none, and keep only the reasons the
      workbench's call still exists (capability gate, sandboxed plugins, the reported outcome).
- [x] 4.2 `docs/building-a-distribution.md`: the sentence about navigation reaching a surface another
      pane already holds now holds for every navigation, not only the workbench's own.
- [x] 4.3 `llms.txt`: the routing entry states the asymmetry as fact — correct it.

## 5. Hand over

- [x] 5.1 `openspec validate --all --strict` and the repository's own guards for the touched project.
- [x] 5.2 Open the pull request naming both halves: the new `routing` requirement, and the
      `popout-windows` defect this closes.
