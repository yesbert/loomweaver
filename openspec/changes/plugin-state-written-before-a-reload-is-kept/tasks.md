## 1. Pin the defect

- [x] 1.1 `plugin-state.service.spec.ts`: a write followed at once by `pagehide` reaches the store; a key written every 240 ms reaches the store within two seconds; a cleared key is not written on `pagehide`
- [x] 1.2 `view-state.service.spec.ts`: the same three cases for a surface instance's state
- [x] 1.3 Run them and see them fail on the current code

## 2. Fix

- [x] 2.1 The held-write slice under `persistence/`: schedule, cancel, flush, the 400 ms quiet time, the 2000 ms bound and the `pagehide` flush, with its own spec
- [x] 2.2 `PluginStateService` uses it and drops its own timer
- [x] 2.3 `ViewStateService` uses it and drops its own timer
- [x] 2.4 `docs/backend-integration.md`, `docs/weaver/plugin-state.md`, `docs/weaver/view-state.md`, the JSDoc of `StateHandle.set` and `llms-full.txt` state the write profile and the limit for an asynchronous store

## 3. Verify

- [x] 3.1 The full shell suite
- [x] 3.2 Lint, formatting, `nx package shell` and the docs checks
- [x] 3.3 In the testbed, end to end: write plugin state, reload at once, read it back; red with the page-leave flush disabled, green with it

## 4. Close

- [x] 4.1 `openspec validate --all --strict`
