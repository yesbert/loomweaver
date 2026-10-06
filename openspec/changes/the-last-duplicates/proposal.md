> **Status:** approved — approved for implementation on 2026-10-06.

## Why

The audit's duplication pass left five copies standing, each for a reason that held inside that
change but not for good: they do not disagree yet, or removing them meant reshaping an input, or they
sat in sample code rather than the platform. A copy that does not disagree today is the next one
that will, and the audit's own defects all started that way.

## What Changes

- **Chrome item activation.** The rail and the bar each run the same sequence when an item is
  activated: refuse while disabled, warn about a menu-trigger conflict, open the item's menu where it
  has one, otherwise run it. One function owns the sequence; the rail adds its workspace switch
  around it.
- **The bar button is resolved once.** The bar resolves every button to decide what it draws, then
  each bar item resolves its own button again. The bar hands each item the entry it already
  resolved.
- **The toolbar entry and the frame's slot entry.** The element's entry type is pinned to the frame
  kit's published slot entry by a type test, so the two field lists cannot drift. The frame kit's
  declaration stays free of imports, as its build requires.
- **Samples and the navigation tree.** Recipe 11 on the samples page repeats most of the navigation
  tree guide's code. The guide keeps the walkthrough; the recipe keeps the complete files and the
  guide links to them for the whole.
- **The demo's repeated list skeleton and context holder.** Thirteen list views write the same outer
  card and their column template twice each; nine modules hand-roll the same holder for the plugin
  context. The demo gets one class for the card, one constant per view for its columns, and one small
  factory for the holder.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No behaviour changes; the change sets `skip_specs`.

## Impact

- Shell: the rail, the bar and the bar item; the toolbar element's entry type.
- Docs: `docs/samples.md` recipe 11 and `docs/weaver/navigation-tree.md`.
- Demo: its list views and its plugin modules.
