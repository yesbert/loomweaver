## 1. Pin the defect

- [x] 1.1 `a-container-outlives-its-arrangement.spec.ts`: a container mounted at `box/b`, the arrangement replaced (`PaneTreeService.hydrate`); assert the children are laid out again with `box/b` focused, and the address stays `/box/b`
- [x] 1.2 The same file: focusing another child still moves the address, so the fix cannot swallow a click
- [x] 1.3 Run 1.1 and see it fail on the current code
- [x] 1.4 Testbed: a gated container `gated/:id` with gated children at `general` and `design`, an initial arrangement of both, and a gated overview at `gated`
- [x] 1.5 Testbed switches: a session that arrives after a delay with the store identity following it, optionally awaited by an app initializer, and a workspace that claims `gated`
- [x] 1.6 `gated-container-cold-start.spec.ts`: a cold start at `/gated/one/design`, `/gated/one/general` and `/gated/one`, for both arrivals of the session; see the two child addresses fail on the current code

## 2. Fix

- [x] 2.1 `ContainerPaneHost`: a computed that says whether the container's dock exists; `followUrl` lays the dock out again when it does not, before it opens the addressed child
- [x] 2.2 Run the unit test and the browser case green

## 3. Verify

- [x] 3.1 The full shell suite
- [x] 3.2 The testbed's container suites (`container.spec.ts`, `container-children.spec.ts`) and the access suites (`auth.spec.ts`, `pane-access.spec.ts`) in the browser
- [x] 3.3 Lint for the shell, the testbed weaver, the testbed and its end-to-end project
- [x] 3.4 The testbed's initial bundle: the gated container and the switches add 1.6 kB, so its ceiling moves from 905 to 910 kB. Lazily loaded children were tried and rejected: they moved 110 kB of shared code out of the initial bundle and would have broken the series the ceiling tracks

## 4. Close

- [x] 4.1 `openspec validate --all --strict`
- [x] 4.2 Note in the PR that this closes NextPA finding F-042, and F-032 for containers
