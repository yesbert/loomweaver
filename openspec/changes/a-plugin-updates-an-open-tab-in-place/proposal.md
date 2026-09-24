> **Status:** proposed — not approved for implementation yet.

## Why

A tab's own label and badge can only be changed by opening the tab again, and opening always brings
it forward. A product whose content changes state behind the tab the person is looking at cannot
keep that tab's badge true without pulling the person away. The demo met this on 2026-09-24: an
agent sends a draft quote whose tab sits behind another, and the tab keeps saying "Draft" until it
is opened again.

## What Changes

- A plugin can change the title, icon and badge of a content tab that is open, where it stands,
  without bringing it forward: `ctx.updateContentTab(path, label)`. The tab rooted at the path takes
  what the label gives as its own; what the label leaves out stays, and a badge given as `null` is
  taken away.
- It changes a tab in any pane of the main area, the one carrying the address or another. It never
  opens a tab, never moves the focus and never changes the address; for a path with no open tab it
  does nothing.
- It changes only tabs whose content the calling plugin registered, and needs the `contributions`
  capability. It crosses the sandbox like the other calls, with its label rebuilt at the seam.
- The distribution's own tab service gains the same operation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-tabs`: a new requirement, "An open tab's label may be changed where it stands".

## Impact

- `@loomweaver/plugin-sdk`: `PluginContext.updateContentTab` and the label type it takes.
- `@loomweaver/shell`: the content tab service, the host plugin context, the sandbox contract and its
  sanitising.
- Docs: `docs/weaver/content-area.md`, `docs/weaver/sandboxed-surfaces.md`, `docs/plugins.md`,
  `docs/distribution-api/tabs.md`, `llms-full.txt`.
- Released as the patch 0.14.1, together with `a-tab-keeps-its-title-before-its-badge` and
  `a-dialog-body-asks-for-the-close-the-person-would-make`. The owner ships an added method in a
  patch.
- No legacy source is dissolved.
