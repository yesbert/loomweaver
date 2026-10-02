> **Status:** approved.

## Why

A plugin's private store and a surface instance's state both hold a write back for 400 ms, and the
timer restarts on every further write. Nothing sends the held write when the page goes away. So a
value written just before a reload never reaches the store, and a key written more often than every
400 ms is not stored at all while the writes continue. TreeWeaver's knowledge-base plugin met both
(its finding #49): it records the job the server accepted for an upload, a reload within 400 ms of
the acceptance comes back without it, and a batch of uploads 240 ms apart stored nothing until the
last file.

The contract calls both places working state that survives a reload and says nothing about a window
in which that is untrue.

## What Changes

- **A held write is sent when the page goes away.** Reloading, closing or navigating away sends
  every write that was still waiting, in the main window and in a pop-out alike.
- **A held write waits no longer than two seconds.** Further writes to the same key still postpone
  it, but only up to that bound; then the latest value is sent while the writes continue.
- Both rules hold for a plugin's private store and for a surface instance's state, which today carry
  the same timer twice. They share one writer afterwards.
- The plugin guide and the backend guide say what a product's store sees: at most one write per key
  per 400 ms of quiet, at least one every two seconds under continuous writing, and one on leaving.

No new call, option or type. A plugin that wants its value stored keeps calling `set`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `persistence-ports`: adds the guarantee that a held write is sent on leaving the page and within a
  bounded wait, with its limit for a store that answers only asynchronously.

## Impact

- `platform/libs/core/shell/src/lib/plugin/plugin-state.service.ts` and
  `platform/libs/core/shell/src/lib/views/view-state.service.ts`: both use the shared writer.
- A new slice under `platform/libs/core/shell/src/lib/persistence/` for the held write and the
  leave-page flush, with its tests.
- `docs/backend-integration.md`, `docs/weaver/plugin-state.md`, `docs/weaver/view-state.md`,
  `llms-full.txt` and the JSDoc of `StateHandle.set`: the write profile.
- A product whose working-state store is a network call sees one more write per changed key when the
  page is left, and a write every two seconds under continuous change where it saw none.
- No legacy source is dissolved.
