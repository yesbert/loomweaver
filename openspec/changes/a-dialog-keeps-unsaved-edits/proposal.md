> **Status:** approved.

## Why

A dialog that edits something cannot protect what the user typed. Whoever opens a dialog chooses
only between two extremes: every way of closing it works, a click beside it included, or none does.
Choosing none also removes the close control and Escape, so a form that merely wants a stray click
beside it to do nothing has to give up the workbench's frame and draw its own title, close control
and footer. And a dialog cannot ask before closing, the way a tab holding unsaved work already does,
so edits are lost silently to Escape, a click beside it or the close control.

NextPA found this planning a profile dialog (finding F-021). The answer is not NextPA's: there are
three kinds of dialog that edit something, and the platform should serve all three.

- **A form with its own save and cancel.** Saving and cancelling are its buttons. Escape and the
  close control are deliberate and read as cancel; only a click beside the dialog is an accident.
- **A dialog that asks on closing.** It has no save button, and every way of closing it asks while
  something is unsaved, as closing a tab does.
- **A dialog that saves as the user changes it,** such as the settings. Nothing is ever unsaved, so
  nothing should ask or block. That is today's behaviour and it stays.

## What Changes

- Whoever opens a dialog chooses which of the user's ways close it, from three: every way, only
  deliberate ways (Escape, the close control, a cancel), or none. A click beside the dialog is the
  one way that is not deliberate. The choice governs the user only; the dialog's own code can always
  close it. The default is every way, which is today's behaviour.
- The close control is drawn whenever the user may close the dialog deliberately, so choosing
  "only deliberate ways" keeps the workbench's frame intact.
- **BREAKING** The existing on/off switch is removed, not kept beside the new choice. On becomes
  every way, off becomes none; a consumer still passing the switch gets a compile error that names
  it, and the release notes and the dialog guide say how to move.
- A dialog's content may report unsaved work, and may offer to save and to veto, through the same
  contract a tab's content already uses. While it reports unsaved work, every way of closing the
  user is allowed asks the same question closing a tab asks: save (only where the content can save),
  discard, or cancel. The content closing the dialog itself never asks, and a veto that fails or
  hangs cannot make the dialog impossible to close.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-primitives`: two requirements are added. Whoever opens a dialog chooses which of the user's
  ways of closing it work, and a dialog whose content holds unsaved work asks before the user closes
  it. Nothing an existing requirement states changes; the question for a yes-or-no still resolves to
  refusal when dismissed, and progress still cannot be dismissed.

## Impact

- `platform/libs/core/plugin-sdk/src/lib/dialog.ts`: the dialog open options gain the choice of how
  the user may close a dialog, and the existing switch is removed. `dirty-surface.ts`
  documents that a dialog's content takes part in the same contract.
- `platform/libs/core/shell/src/lib/dialog/`: the outlet honours the choice for a click beside the
  dialog, Escape and the close control, and consults the content before any of them closes it. 
- `platform/libs/core/shell/src/lib/regions/pane/close/surface-close-guard.ts`: also serves the
  dialog outlet, through a port the shell composes, so the question about unsaved work and the veto
  with its timeout are the tab's own rather than a second copy.
- `docs/distribution-api/dialogs-and-toasts.md` and `llms-full.txt` describe the new option, the
  removal of the switch with its replacement, and the unsaved-work contract for dialogs.
- Only dialogs rendered by the workbench are affected. A sandboxed plugin cannot open a dialog over
  its channel, so nothing crosses the sandbox.
- NextPA's `loomweaver-findings.md` marks F-021 fixed once a release carries this; that happens in a
  NextPA session, not here.

No legacy source is dissolved by this change.
