> **Status:** approved (owner, 2026-09-24).

## Why

A tab's badge, new in 0.14.0, keeps its full width when a strip runs out of room, and the title
gives way instead. In the demo, three quote tabs at their minimum width read "Q" beside
"Versendet": the part that says which quote it is disappears first, and the part that only
qualifies it stays. Found on 2026-09-24 while the demo adopted the badge.

## What Changes

- Where a tab in a strip that shows titles is too narrow for its title and its badge, the badge
  gives way first. It narrows to a mark in its tone, its text cut, and only once it has become that
  mark is the title shortened.
- The tooltip of a tab in such a strip carries the title with the badge, as the accessible name
  already does, so a badge that has given way can still be read. Today it carries the title alone.
- Nothing changes for a tab with room for both, or for a strip that shows icons only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-tabs`: "A tab may carry a badge beside its title" gains the rule that the title comes
  before the badge where a tab is too narrow for both, and that the tooltip carries the badge.

## Impact

- `@loomweaver/shell`: the pane tab strip's template (the badge's sizing, its text, the tooltip).
- Tests: the tab strip's badge spec, and a testbed end-to-end test on a narrow tab.
- Released as the patch 0.14.1, together with `a-plugin-updates-an-open-tab-in-place` and
  `a-dialog-body-asks-for-the-close-the-person-would-make`.
- No legacy source is dissolved.
