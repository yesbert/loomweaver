## 1. Establish the cause before changing anything

- [x] 1.1 Reproduced from a clean profile. The surface sits inside a `div[data-lw-retention-hold]`
      carrying `display: none`, appended to `body`. That element is the retention stash's holding
      area, so the surface is not merely hidden, it is out of the pane entirely.
- [x] 1.2 Instrumented both paths. They are identical up to and including the mount: the surface is
      acquired and placed correctly inside `lw-content-area`. On arrival, and only there, a later
      event follows: the pane tree hydrates from stored working state and evacuates the whole content
      dock, which moves the surface into the holding area. Nothing brings it back.
- [x] 1.3 Neither seam the design named, and the design's rule did not fit, so the rule is recorded
      as wrong rather than forced. The fault is that evacuation has no matching return. The pane tree
      evacuates in-use retained surfaces so they survive an arrangement swap, and relies on the new
      arrangement re-mounting them. Where hydration yields an arrangement that renders identically,
      no host re-mounts, and the surface stays evacuated. The seam is the retained host: it is never
      told its nodes were taken.
- [x] 1.4 Settled: the warning is right about component surfaces and wrong to fire at sandboxed ones.
      An iframe surface has no Angular outlet to leave inert, and it already does what the warning
      advises, reading the sub-segment from the address over RPC. The warning fired at a surface that
      followed its own advice, on every boot. It now excludes iframe surfaces. Nothing about the fix
      depends on a retained surface seeing the router.

## 2. Fix it at the seam that is wrong

- [x] 2.1 Added a failing test: an in-place retained surface that is evacuated while its mount stands
      must come back to it.
- [x] 2.2 The stash now announces an evacuation the way it announces every other change, and a
      retained host that finds its nodes taken puts them back. The repair is deferred by one task, so
      it never runs inside the swap it exists to survive: an eager version put a surface back into a
      sidebar that was about to be destroyed, which cost that surface its state.
- [x] 2.3 Corrected the warning, and left the testbed declaration and its test alone. Two tests pin
      it: a component surface declaring both still warns, a sandboxed one stays quiet.

## 3. Confirm it from the outside

- [x] 3.1 Both pass, unedited.
- [x] 3.2 The suite runs 317 tests with none failing for a reason of its own. Under local
      parallelism one test flakes per run and it is a different one each time, which is how it behaved
      before this change; the nightly runs single-threaded with retries.
- [x] 3.3 1494 unit tests pass, lint is clean, the structure guard matches its baseline, and the
      retention suites that existed before are unedited.
