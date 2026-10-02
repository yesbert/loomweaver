> **Status:** approved.

## Why

Since 0.15.0 a control whose activation opens a menu is drawn only while that menu offers an entry,
so that one plugin can own a slot and others fill it. That holds for a control whose only purpose is
the menu. A control that also has an action of its own is hidden along with it while the slot is
empty, although its action would work, and once the slot has an entry the action is unreachable from
the control. TreeWeaver's add button is exactly this (the second half of its finding #47): with no
further source it opens its own dialog at once, and with sources it opens a menu led by its own
entry. It could express neither on the platform and kept a command-id convention and the
`automation` capability in order to count the sources itself.

## What Changes

- **A control that names an action of its own and a menu on activation is always drawn.** While its
  menu offers no entry, activating it runs the action. While the menu offers an entry, activating it
  opens the menu, as before.
- **The control's own heading does not count as an entry** for this decision, so a control can lead
  its menu with its own action and still run it directly while nobody else contributes.
- The control is announced as opening a menu only while it will open one.
- The development warning that said such a control's action "is never run from here" is removed,
  since it now is.
- This holds for launcher entries, bar buttons and surface actions alike. A control with no action
  of its own behaves as in 0.15.0.

Not in this change: a call for a plugin to read a slot. With this, the case that asked for one is
served without it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `menus`: *Any contributed control may carry a menu of its own* says what a control with an action
  of its own does while its menu is empty, in place of ignoring the action.

## Impact

- `platform/libs/core/shell/src/lib/menu/chrome-item-menu.ts` and a small service beside it that
  answers, for one item, whether it is offered and which menu its activation opens.
- `platform/libs/core/shell/src/lib/regions/rail/shell-rail.ts`, `regions/bar/shell-bar.ts`,
  `regions/bar/shell-bar-item.ts`, `regions/curation/rail-curation.ts`,
  `regions/content/actions/surface-actions.ts`: use it.
- `platform/libs/core/plugin-sdk/src/lib/chrome/menu.ts`: the JSDoc of `MenuTrigger`.
- `docs/weaver/menus.md`, `llms-full.txt`, the testbed weaver and its end-to-end test.
- No change to the published types. A control that relied on its action being ignored now runs it
  while its menu is empty; before 0.15.0 it opened nothing there, and in 0.15.0 it was absent.
- No legacy source is dissolved.
