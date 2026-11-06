# Tasks

Paths are under `platform/libs/core/shell/src/lib/`.

## 0. Audit

- [x] 0.1 Inventory of the concern: the fold order and the fold loop are shared by the bar and the toolbar (`elements/row-fold.ts`), the bar ranks its entries in `regions/bar/bar-fold.ts` and measures them in `regions/bar/shell-bar.ts`; the identity entry is declared in `regions/bar/default-bar-items.ts` and drawn by `regions/bar/shell-brand.*`; the top bar's host sits in `shell.html`. Governing requirements: shell-layout "A bar too narrow to show everything stays usable", "A bar folds its last entries first", "Folding follows the bar's width"; product-identity "The product's mark is the last part of its identity to give way".

## 1. Fold the buttons before the name

- [x] 1.1 Test first: an entry that shortens itself is measured at its natural width, so a button folds before the name is cut (`regions/bar/shell-bar.spec.ts`)
- [x] 1.2 Test first: the identity never folds and shortens once nothing else can (`regions/bar/shell-bar.spec.ts`, `regions/bar/bar-fold.spec.ts`)
- [x] 1.3 Measure each bar entry at its natural width, with one helper beside the existing width reader (`elements/row-fold.ts`, `regions/bar/shell-bar.ts`)
- [x] 1.4 The fold loop skips an entry that stays; the bar names its identity entry as the one that stays (`elements/row-fold.ts`, `regions/bar/default-bar-items.ts`)
- [x] 1.5 Test first, then fix: the top bar may narrow with its column (`shell.spec.ts`, `shell.html`)
- [x] 1.6 End-to-end: with a long tagline, a button folds before the name is cut, the name is cut only once every button has folded, and the buttons come back on a wide window (`platform/apps/loom-testbed-e2e/src/bar-fold.spec.ts`)

## 2. Contract and guides

- [x] 2.1 Delta: a scenario for each of the two requirements, wording unchanged
- [x] 2.2 The guide line on bar folding states the order (`llms-full.txt`)
