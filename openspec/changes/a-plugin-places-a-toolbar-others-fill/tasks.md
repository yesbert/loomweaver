## Before slice 1 — read what is there

### 0. Inventory, before a line is written

- [ ] 0.1 Side by side, from source: how `shell-rail.ts`, `shell-bar.ts`, `shell-bar-item.ts`,
  `surface-actions.ts`, `command-rows.ts`, `rail-curation.ts` and `menu.service.ts` each filter
  (access, offered, triggerable, available, pop-out), sort, label, icon, tooltip, shortcut and run
  an item. One table, one row per concern, one column per dock, with the line each lives on
- [ ] 0.2 From that table: which concerns `resolveSlot` absorbs, which stay dock-specific and why
  (the spec names the reason or the row is a duplication to remove), and which existing helper
  each absorbed concern already has (`ChromeItemOffers`, `chrome-item-menu.ts`,
  `MenuTriggerDirective`, `bar-fold.ts`, `roving-focus.ts`, `picture-primitives.ts`,
  `warnMenuTriggerConflict`) so none is written a second time
- [ ] 0.3 The picture → initials → icon ladder in `shell-rail.html` and `shell-bar-item.html`, with
  their two `brokenPicture` signals: one shared piece, used by both and by the toolbar
- [ ] 0.4 Every test that pins today's dock behaviour, listed, so slice 1 can show which it keeps
  green and which it changes on purpose
- [ ] 0.5 The result goes into design.md under *Context* before slice 1 starts; a concern the table
  shows to be shared but not listed in this plan is added to the plan, not worked around

## Slice 1 — one resolution, declared slots

### 1. Pin it

- [ ] 1.1 `menu-resolution.spec.ts`: the one function drops an entry whose command the session may
  not run, or that does not belong in a detached window, and marks `pressed` and `opensMenu`
- [ ] 1.2 `shell-rail.spec.ts`, `shell-bar.spec.ts`, `surface-actions.spec.ts`: a control declaring
  no requirement and naming a command with one is absent while the session does not qualify and
  present once it does, in the main window; these fail on the old code
- [ ] 1.3 `command-rows.spec.ts`: the palette rows come from the same function and are unchanged
- [ ] 1.4 `composition-checks.spec.ts`: an entry aimed at a slot no control, toolbar or built-in
  menu declares is reported with entry, slot and plugin; one declared by a later plugin is not;
  the testbed's three slots are declared by their controls
- [ ] 1.5 Testbed fixture: a rail entry naming a role-gated command without a requirement of its
  own, beside the existing sign-in switch, and an end-to-end case that sees it appear with the role

### 2. Build

- [ ] 2.1 `resolveSlot` in `menu/`: `resolveMenuItems` plus the `available` and pop-out rules that
  `MenuService` applies afterwards, returning `pressed`, `opensMenu` and the contributing plugin;
  `MenuService` reads it
- [ ] 2.2 Rail, bar item and surface actions map their items through it; their own
  `isShownHere`/`belongsInThisWindow`/`contributed` filters shrink to the item-level `access` and
  `offered` checks the spec keeps
- [ ] 2.3 The palette's `commandRows` reads the same function
- [ ] 2.4 `declaredSlots` computed from rail items, bar buttons, surface actions, registered
  toolbars and the built-in slot list; `undeclaredSlots` in `composition-checks.ts`; the
  post-activation development warning and the store's install path run it
- [ ] 2.5 `docs/weaver/menus.md` and `docs/weaver/access-gating.md`: the command's requirement
  decides whether a control is drawn; `llms-full.txt`

### 3. Verify and close

- [ ] 3.1 The full shell suite, lint, `nx package shell`, the docs checks, the structure check
- [ ] 3.2 The full end-to-end suite
- [ ] 3.3 `openspec validate --all --strict`; release notes name the hidden-control change

## Slice 2 — a toolbar a plugin places in its own content

### 4. Pin it

- [ ] 4.1 `lw-toolbar` element spec, registered from the published surface without a running
  workbench: draws resolved entries side by side with icon, tooltip and shortcut; `aria-pressed`
  for a state; `role="toolbar"` named by the placement's label, or by the registered title where
  the placement gives none, worded and following the strings; roving focus with the arrow keys; takes no
  space while the slot offers nothing; light-DOM cells with `slot="cell"` placed by order
- [ ] 4.2 Folding: entries beyond the width fold from the end into a control whose menu offers
  them; a cell folds whole; folding follows the width in both directions; zero width suspends it
- [ ] 4.3 `registerToolbar`: two plugins on one slot are refused naming both; the same plugin
  replaces; the toolbar dies with its plugin; a registered toolbar declares its slot
- [ ] 4.4 `registerToolbarCell`: a foreign in-page cell is drawn, told the placement's description
  through its context token, hidden on an unmet requirement whatever mode it asks for
- [ ] 4.5 Surface actions as a toolbar: every existing `surface-actions.spec.ts` case holds against
  `<lw-toolbar slot="<surface>/actions">` in the panel header, the tab strip, the floating header
  and the pop-out; `updateSurfaceAction` still replaces one entry without rebuilding the surface;
  a second plugin's entry appears in the header
- [ ] 4.6 Testbed: a toolbar on a record list placed once per row with the row's description, filled
  by a second testbed plugin with a `when`-filtered entry, a nested menu entry, and one component
  cell; end to end: the entry runs with the row's id, the other row does not show it, the fold
  control appears on a narrow window

### 5. Build

- [ ] 5.1 `MenuItem` gains `icon?`, `access?`, `menu?`, `menuTrigger?`, `menuHeader?`; `resolveSlot`
  carries them; the JSDoc on the published contract says what each is for
- [ ] 5.2 `Toolbar` (slot, title) and `ToolbarCell` in `plugin-sdk/chrome/`; `registerToolbar` and
  `registerToolbarCell` on the context; the registry records owner per slot and refuses a second
- [ ] 5.3 `shell/elements/toolbar/`: the element, its bridge interface, the in-page bridge the shell
  installs at boot, the fold with `bar-fold.ts`'s ranking, the `TOOLBAR_CONTEXT` token for cells
- [ ] 5.4 The registry maps a surface's declared `actions` onto `<surface-id>/actions` entries and
  routes `updateSurfaceAction` to the mapped entry; the four hosts embed the toolbar;
  `lw-surface-actions` is removed
- [ ] 5.5 Scaffolding: the frame-plugin and weaver generators' templates mention the toolbar where
  they mention menus; `validate_commands` accepts the new `MenuItem` fields
- [ ] 5.6 `docs/weaver/menus.md` (toolbars), `docs/weaver/content-area.md` (surface actions are a
  slot others may fill), `docs/reference/design-tokens.md` (the element), `llms-full.txt`

### 6. Verify and close

- [ ] 6.1 The full shell suite, lint, `nx package shell`, the packed-`.d.ts` docs guard for every
  new export, the structure check, the bundle-size ratchet
- [ ] 6.2 The accessibility scan over a placed toolbar with a pressed entry and a folded one
- [ ] 6.3 The full end-to-end suite, including the distribution served under a path
- [ ] 6.4 `openspec validate --all --strict`

## Slice 3 — the toolbar inside an isolated surface

### 7. Pin it

- [ ] 7.1 Frame RPC spec: `watchSlot` answers the resolved entries as data, narrowed by the
  command's requirement, the window and the frame plugin's foreign-command grant; a cell is absent;
  a context that is not data is refused; `slotChanged` fires on an entry, a command, the session
  and the language changing; `unwatchSlot` and teardown stop it
- [ ] 7.2 Frame-kit element spec: `<lw-toolbar>` inside a frame draws from the frame bridge and
  invokes through `invokeCommand` with the placement's description
- [ ] 7.3 Testbed: the sandboxed surface draws a toolbar on a slot a page plugin fills; end to end:
  the entry appears, runs, and disappears when the session loses the role, without a reload

### 8. Build

- [ ] 8.1 `frame-rpc-contract.ts`: `watchSlot`, `unwatchSlot`; `FrameRemote.slotChanged`; the
  surface channel exposes them beside `stateWatch`; wire validation of the context
- [ ] 8.2 The host side: a watch is a computed over `resolveSlot` for the frame's plugin, pushed on
  change, dropped with the channel
- [ ] 8.3 Frame-kit: the frame bridge for `<lw-toolbar>` installed by `installLwFrame()`; the
  published declaration describes it
- [ ] 8.4 `docs/weaver/sandboxed-surfaces.md`, `llms-full.txt`

### 9. Verify and close

- [ ] 9.1 The full shell and frame-kit suites, lint, `nx package` for shell, plugin-sdk and
  frame-kit, the docs checks
- [ ] 9.2 The full end-to-end suite
- [ ] 9.3 `openspec validate --all --strict`
