> **Status:** proposed — not approved for implementation yet.

## Why

A menu draws an entry for a command the session may not run. Choosing it does nothing: the one place
every trigger runs through refuses the command, and in development a message says so. The palette
already hides such a command, and since 0.15.0 a control that exists to open a menu is hidden while
every entry of that menu is of this kind. The open menu is the one place left that offers what
cannot be used, so the same slot now reads two ways: empty when the workbench decides whether to draw
its control, and filled when it is opened. Raised in review of the surface-actions change and left
out of it on purpose, because it changes every menu rather than the one being built.

## What Changes

- **An open menu draws only entries whose command the session may run.** That covers a command whose
  access requirement is unmet and, in a pop-out, one that does not declare itself suitable there.
- **A menu left with no entry does not open**, which is what already happens to an empty slot.
- The check that decides whether a menu-only control is drawn and the menu it opens use the same
  list, so they cannot disagree.
- **BREAKING (behaviour):** an entry that was drawn and did nothing is no longer drawn. A heading
  that leads to a command the session may not run becomes a plain heading.

Not changed: an entry with inline behaviour and no command. It declares no requirement, so there is
nothing to hold it against.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `menus`: *An entry that cannot work is not drawn* gains the command the session may not run.

## Impact

- `platform/libs/core/shell/src/lib/menu/menu.service.ts`: `open` and `offers` resolve against the
  commands the session may run.
- `platform/libs/core/shell/src/lib/menu/menu.service.spec.ts`, the tab-strip and rail specs that
  open menus.
- `docs/weaver/menus.md`, `docs/weaver/access-gating.md`, `llms-full.txt`.
- No change to the published types.
- No legacy source is dissolved.
