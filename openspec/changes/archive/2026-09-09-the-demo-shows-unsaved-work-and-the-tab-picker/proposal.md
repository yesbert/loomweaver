> **Status:** approved.

## Why

Two things the shell does for every product cannot be seen in the demo, and so could not be
photographed for the guide that shows the workbench one picture at a time. Nothing in the demo
reports unsaved work, so the prompt that asks *Save*, *Discard* or *Cancel* never appears. And the
*New tab* button on a tab strip opens its picker only when it has something to offer, which is a
content route hosted at a bare path; every route in the demo sits under a module, `sales/customers`
and its siblings, so the button opens nothing. Both were recorded as findings when the guide was
built (task 1.3 of the archived change `the-workbench-is-shown-not-listed`), and this change is
where they are answered.

## What Changes

- **One view in the demo reports unsaved work.** The quote document is the natural one: a field a
  visitor can edit, the surface saying it is dirty while the edit is unsaved, and the shell's own
  prompt when the tab is closed or the workspace reset. The demo gets a small save that keeps the
  edit for the session, nothing more.
- **The New tab picker offers something in the demo.** Which of two answers is right is decided
  while building, by looking at it: a bare-path route the demo can honestly host, such as the
  overview dashboard, or a finding that the picker should offer routes nested under a module too.
  The second is a platform question and gets its own change if it is the answer; this change does
  not decide it in advance.
- **Two more motifs for the capture script**: `unsaved-changes` and `tab-picker`, in light and dark,
  and the guide's section on quick open and the picker gets its picture, the retention concept page
  gets the prompt.

No guarantee changes: the shell already asks about unsaved work and already offers a picker. The
change declares `skip_specs`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. `surface-retention` already requires the unsaved-work question, and `access-gating` already
says what a picker offers. If the picker's bare-path rule turns out to be the defect, that is a
delta on `content-tabs` in a change of its own.

## Impact

- `demo/src/quotes/`: the quote document becomes editable in one field and implements the dirty
  contract the plugin SDK publishes.
- `demo/src/app/app.config.ts` or `demo/src/insights/`: possibly one bare-path route, if that is the
  answer.
- `platform/tools/capture-screenshots.mjs`: two motifs; `assets/media/`: four files.
- `docs/the-workbench.md` and `docs/concepts/retention-and-unsaved-work.md`: the pictures.
- `demo/e2e/`: a test that editing a quote and closing its tab asks, and that the picker opens.
