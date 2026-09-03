## 1. One source of truth for the switches

- [x] 1.1 Add the root service in a slice of its own (`lib/features/`) that reads `SHELL_FEATURES` once, holds
      the current set in a writable signal, exposes one `Signal<boolean>` per switch under the
      existing group and switch names plus the whole set, and offers `update(ShellFeaturesInput)`
      merging group by group like the provider does.
- [x] 1.2 Table-driven spec: for every switch in `DEFAULT_SHELL_FEATURES`, the service reads the
      declaration at start, `update` on that switch alone flips it and leaves every other switch
      unchanged, and a `computed` depending on it re-evaluates.
- [x] 1.3 Spec: `update` writes nothing to the working-state store or the settings store.
- [x] 1.4 Lint restriction so that `SHELL_FEATURES` may be injected only in the new service and in
      `provide-shell.ts`; run lint to see it fail on the current readers before they are moved.

## 2. Every reader reads live

- [x] 2.1 `pane-view.ts`, `pane-drop-zones.ts`, `pane-tab-strip.ts` (the copied `escalatable`
      boolean becomes a signal read in the template), `content-area.ts`, `content-tabs.service.ts`:
      inject the service, read the signal where the value is used, adjust templates.
- [x] 2.2 `shell-sidebar-header.ts`, `shell-panel.ts`, `curation-dialog.ts`, `shell-rail.ts`,
      `rail-workspace-entries.ts`: same.
- [x] 2.3 `command.service.ts` (`shortcutOf` reads `commands.shortcuts()` when called),
      `command-palette.ts` (`recentlyUsed` read in the template or a `computed`),
      `keybinding.service.ts` (listener always installed, switch checked per keystroke and in the
      hint logic).
- [x] 2.4 Adjust the existing specs of the files above where they provided `SHELL_FEATURES` as a
      constant; add to each a case that flips the relevant switch through the service and asserts
      the control or behaviour follows.
- [x] 2.5 Rendered spec on the pane toolbar and tab strip: with every content switch on, turn
      `splitRight`, `splitDown`, `maximize`, `minimize`, `close`, `pin`, `newTab` off one at a time
      and assert the control disappears and reappears without re-creating the component.
- [x] 2.6 Lint is clean, including the new restriction.

## 3. Built-in seeds follow the switch

- [x] 3.1 In `shell-seeds.ts`, wrap each switch-conditional command (`shell.content.splitRight`,
      `shell.rail.customize`, `shell.views.customize`, `shell.workspace.manage`,
      `shell.workspace.reset`) in an `effect` that registers it when its switch is on and disposes
      the returned `Disposable` when it turns off; keep the unconditional ones as they are.
- [x] 3.2 Inventory `seedBuiltInMenus` for switch-conditional menu entries and apply the same
      pattern.
- [x] 3.3 Spec: with `splitRight` declared off, the command is absent; `update` turns it on and the
      command is registered, findable and bound to `mod+\`; `update` turns it off and it is gone
      again. Flush effects before each assertion and say so in the spec.
- [x] 3.4 Spec for a menu-entry seed found in 3.2, same shape.

## 4. Pin the rules

- [x] 4.1 Forward-only: split a pane, turn `splitRight` and `splitDown` off, assert the pane tree is
      unchanged and the split controls are gone.
- [x] 4.2 Forward-only: collapse a sidebar, turn `sidebar.collapse` off, assert it stays collapsed
      and the header offers no expand control.
- [x] 4.3 Reachable while off: turn `content.close` off, close a tab through `ContentTabsService`,
      assert it closes; with a dirty surface in it, assert the unsaved-work question is asked.
- [x] 4.4 Reachable while off: turn `windows.popout` off, call `PopoutService.open`, assert the
      pop-out is opened.
- [x] 4.5 Not remembered: after `update`, a fresh injector seeded from the same declaration reads the
      declaration, not the change.

## 5. Contract and documentation

- [x] 5.1 Export the service from `@loomweaver/shell` (`index.ts`).
- [x] 5.2 `docs/reference/host-services.md`: new section for the switches in the style of the
      neighbouring sections; the read, the update, forward-only, not remembered; add the new
      capability to the `derived-from-specs` line.
- [x] 5.3 `docs/building-a-distribution.md`, *Switching capabilities off*: the declaration is the
      starting value; the switches can be read and changed at runtime; point at the reference.
- [x] 5.4 Package the shell and run `check-api-docs.mjs`; every new exported name is documented.

## 6. Verify and hand over

- [x] 6.1 `npx nx run-many -t test lint` for the shell is green; `npm run structure-check` matches
      its baseline (the new `features/` slice holds one concept and needs no entry).
- [x] 6.2 `openspec validate feature-switches-at-runtime --strict` passes.
- [x] 6.3 Hand check dropped by decision (2026-09-03): the browser console cannot reach the service
      by name, and the rendered specs already show the toolbar controls appear and disappear on
      `update` without re-creating the component (pane-view, tab strip, seeds).
