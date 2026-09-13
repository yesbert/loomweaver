> **Status:** approved.

## Why

A surface's own actions, the icon buttons the panel header and the tab strip draw while the surface
is active, are read once when the surface is registered and never again. A surface can be renamed
while it runs, but its actions cannot change with it, so an action that switches something on and
off reads the same in both states: its title cannot turn from "Float the chat" into "Bring the chat
back", its icon cannot look pressed, and there is no way to say it is a toggle at all. To the eye
that is a button that seems to do nothing the second time; to a screen reader it is a plain button
with no state, because `aria-pressed` cannot be declared.

NextPA found this building its chat (finding F-017) and placed its float toggle inside the chat's
own toolbar, which is a legitimate placement. What it could not have is the toggle beside the
workbench's own actions in the header, and any distribution that wants a toggle there is in the
same position.

## What Changes

- A plugin may replace one action of a surface it registered, under the surface's id and the
  action's id, while the surface is mounted. Wherever the workbench draws that surface's actions
  follows, and the surface itself is not rebuilt. An action id the surface did not carry is added,
  so the same call serves an action that appears later.
- An action may declare that it is a toggle and which state it is in. The workbench draws that
  state where it draws the action, visibly and as `aria-pressed`, so a screen reader announces a
  toggle as a toggle and the user sees which way it stands.
- The guarantee is held on the in-process runtime. A sandboxed surface carries no actions today,
  because its declaration is reduced to plain data on the way in and actions are not among what is
  kept, so there is nothing there for this call to replace. That gap is named, not closed here.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surfaces`: the requirement *A surface may be renamed while it is mounted* lets the name change
  and says a rename reaches the name only. A requirement is added beside it for an action that can
  be replaced while the surface is mounted, and for a toggling action that carries its state.

## Impact

- `platform/libs/core/plugin-sdk/src/lib/view.ts` carries the action shape the state lands on, and
  `platform/libs/core/plugin-sdk/src/lib/plugin.ts` the `ctx` surface the call lands on.
- `platform/libs/core/shell/src/lib/plugin/contribution-registry.ts` holds the registered entries
  and is where an action is replaced without re-running registration;
  `platform/libs/core/shell/src/lib/plugin/host-plugin-context.ts` exposes it in-process. The
  sandbox runtime beside them is untouched.
- `platform/libs/core/shell/src/lib/regions/panel/shell-panel.html` and
  `platform/libs/core/shell/src/lib/regions/pane/chrome/pane-tab-strip.html` draw the actions and
  gain the pressed state.
- `llms-full.txt` and `docs/weaver/sidebar-surfaces.md` name the new call and the new field beside
  the ones they sit next to.
- NextPA's `loomweaver-findings.md` marks F-017 fixed once a release carries this; that happens in
  a NextPA session, not here.

No legacy source is dissolved by this change.
