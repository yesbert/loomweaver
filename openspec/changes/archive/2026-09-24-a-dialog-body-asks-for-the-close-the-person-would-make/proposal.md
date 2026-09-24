> **Status:** approved (owner, 2026-09-24).

## Why

A dialog's content can close its dialog in two ways, and neither is the close the person makes.
Closing from code never asks, even over unsaved work; a button the opener declares without a result
asks, but the host draws it in its own footer, not where the content puts its controls. A wizard
with its own "Abbrechen" beside "Weiter" therefore has to ask the unsaved-work question itself, in
words that can drift from the host's. NextPA reported this as F-040 on 2026-09-24.

## What Changes

- The dialog handle a content receives gains a way to ask for the person's close:
  `DialogRef.requestClose()`. It runs what the close control runs: the content's veto first, then,
  while the content reports unsaved work, the question Save · Discard · Cancel, with Save only where
  the content can save and a failed save keeping the dialog open. It resolves `true` once the dialog
  is closed and `false` where the person cancels or the veto holds.
- It works whatever the opener chose for the person's ways of closing, because it is the content's
  own control. The focus returns to what opened the dialog, as on every close, and a request while
  the question is already open does not ask a second time.
- `DialogRef.close()` keeps its meaning: the content closes deliberately and nothing asks.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-primitives`: "A dialog holding unsaved work asks before the user closes it" gains the
  content's request for the person's close, which asks like the close control does.

## Impact

- `@loomweaver/plugin-sdk`: `DialogRef.requestClose()`.
- `@loomweaver/shell`: the dialog service and outlet route the request through the close guard the
  close control uses.
- Docs: `docs/weaver/unsaved-changes.md`, `docs/weaver/host-ui-and-facts.md`, `llms-full.txt`.
- Released as the patch 0.14.1, together with `a-tab-keeps-its-title-before-its-badge` and
  `a-plugin-updates-an-open-tab-in-place`.
- No legacy source is dissolved.
