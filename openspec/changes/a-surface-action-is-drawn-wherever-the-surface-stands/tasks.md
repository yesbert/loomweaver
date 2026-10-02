## 1. Pin the gaps

- [x] 1.1 `surface-actions.spec.ts`: a routable surface registered the way a plugin's is keeps its actions; they are drawn in order, change with the surface shown, follow a replacement, and respect access. End to end: drawn in the address pane's header and gone with the surface
- [x] 1.2 The same spec: right-clicking an action that names a menu opens the slot with the action's context; activation opens it beside the action
- [x] 1.3 A spec for the emptiness rule on a rail entry, a bar button and a surface action: absent with an empty slot, present once an entry is registered, absent again when it is disposed
- [x] 1.4 Run them and see them fail on the current code

## 2. The contract

- [x] 2.1 `ViewAction`: `menuTrigger`, `menuHeader`; JSDoc states the headers an action is drawn in and both gestures
- [x] 2.2 The packed-types guard and the docs-coverage guard know the new members

## 3. Drawing

- [x] 3.0 The route round trip keeps `actions`; the registry answers a surface's actions by its id
- [x] 3.1 `lw-surface-actions`: the buttons with tooltip, pressed state, access gating, the menu directive and its announcement
- [x] 3.2 The panel header uses it
- [x] 3.3 The tab strip draws the active surface's actions before the pane's controls where the pane option says so; the address pane header and the floating controls do the same; the strip's dead action row is removed
- [x] 3.4 Activation: menu-on-activate opens the slot beside the action and warns in development when a command or inline behaviour is thereby ignored

## 4. The empty menu

- [x] 4.1 A reactive "slot offers an entry for this context" read on the menu service, using the filters `open` applies
- [x] 4.2 `isOffered` consults it for rail entries, the rail's curation list, bar buttons and surface actions

## 5. Tell

- [x] 5.1 The surfaces and menus guides and `llms-full.txt`: where actions appear, how an action opens a menu, the owner-and-filler pattern with a slot
- [x] 5.2 The testbed weaver: a content surface with a command action, an action that opens a filled slot and one whose slot stays empty

## 6. Verify

- [x] 6.1 The full shell and plugin-sdk suites, lint, formatting, `nx package`, the docs checks
- [x] 6.2 The accessibility scan over a pane header with actions
- [x] 6.3 In the testbed: the full end-to-end suite (376) passes, the header was looked at in the browser, and the menu opens beside its action. A split pane has an end-to-end test of its own; a pop-out was not exercised, and the design note records it as open

## 7. Close

- [x] 7.1 `openspec validate --all --strict`
