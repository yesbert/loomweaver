## 1. Pin the defect

- [x] 1.1 `container-dock-gc.spec.ts`: a registered container `browse/:id` with a child at `item/:itemId`, its tab in the content dock at `browse/alpha/item/beta`, the address elsewhere; assert its dock is kept
- [x] 1.2 `container-children.spec.ts`: two items opened in the browse container, another tab brought to the front, back again; assert both items are still there
- [x] 1.3 Run both and see them fail on the current code

## 2. Fix

- [x] 2.1 `ContainerDockGc`: map each open tab to its tab root before comparing it with the container's path
- [x] 2.2 Run both green

## 3. Verify

- [x] 3.1 The full shell suite
- [x] 3.2 The testbed's container suites and the gated container case in the browser
- [x] 3.3 Lint and formatting of the touched files

## 4. Close

- [x] 4.1 `openspec validate --all --strict`
