## 1. Finish the measurement first

- [x] 1.1 Repeat the busy-loop experiment in real installations of the two engines the automation
  builds could not answer for, across the four arrangements, and record the numbers in the design
  note beside the Chromium ones. By hand — the design note says why an automation harness cannot
  answer this one.
- [x] 1.2 If separate processes turn out to be Chromium-only, weaken the guide's recommendation to
  what survives — storage and document separation — rather than leaving a claim the other engines do
  not keep.

## 2. The level, in the contract and in the frame

- [x] 2.1 A frame plugin's registration carries the level, and an unstated level is the isolated one.
- [x] 2.2 The restriction the frame runs under follows the level, in both places it is applied today:
  the runtime frame and the visible surface.
- [x] 2.3 The same contract, the same broker and the same pushed surroundings hold at either level —
  pinned by a test that runs the same plugin at both.

## 3. Where a frame's documents may come from

- [x] 3.1 The composition may permit origins for a plugin; where it permits none, the application's
  own origin is the only one.
- [x] 3.2 The seam accepts a surface from a permitted origin and refuses one from anywhere else,
  with addresses that execute or carry their content inline refused at every level.
- [x] 3.3 A test for the combination the design recommends: embedded level, sibling origin.

## 4. The cap

- [x] 4.1 The composition carries the highest level a plugin may run at, and the wiring for a
  catalogue carries it for that catalogue as a whole.
- [x] 4.2 A plugin or an entry asking at or below the cap runs at what it asked for.
- [x] 4.3 A request above the cap is refused outright, loudly, and never satisfied at a lower level.
- [x] 4.4 The level is shown wherever a plugin's permissions are shown, and is not among the
  switches that can be withdrawn.
- [x] 4.5 All four pinned by tests, because this is the group whose failure is silent.

## 5. Being told it is not shown

- [x] 5.1 The pushed surroundings carry whether the surface is currently being shown, following the
  workbench rather than the browser's own visibility.
- [x] 5.2 A retained surface is told when the user switches away and when it returns.
- [x] 5.3 The testbed's frame plugin demonstrates winding down and restoring, so the pattern exists
  somewhere a reader can see it work.

## 6. The rename

- [x] 6.1 The mechanism's name in the published contract stops saying "sandbox"; the strict level
  keeps it.
- [x] 6.2 The asset package and the well-known path its documents load from follow, in one step — it
  is not split.
- [x] 6.3 The four plugin documents in this repository, the scaffolding that emits new ones, and the
  three guides follow.

## 7. Say what it is

- [x] 7.1 The guides describe a mechanism with two levels rather than three rungs, state plainly
  that an embedded application is trusted code, and carry the deployment guidance the platform cannot
  enforce: worker scope, storage key prefixes, and — pending 1.1 — origin keying.

## 8. Verify

- [x] 8.1 Build, unit tests, end-to-end suite and the licence gate pass.
- [x] 8.2 `openspec validate --all --strict` passes, and the capability reads as one contract rather
  than one contract with an exception bolted on.
