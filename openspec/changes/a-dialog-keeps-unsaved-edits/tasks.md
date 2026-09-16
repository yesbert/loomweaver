## 1. The user's ways of closing a dialog

- [x] 1.1 In the plugin SDK's dialog options, replace `dismissable` by `dismiss: 'any' | 'explicit' |
      'none'` with JSDoc naming the three values, the default and that it governs the user only.
- [x] 1.2 In the dialog service, carry `dismiss` on the dialog instance in place of `dismissable`:
      the option or `'any'` for `open`, `'any'` for confirm, alert and prompt, `'none'` for progress.
- [x] 1.3 In the dialog outlet and its template: the scrim works only under `'any'`; Escape and the
      frame's close control work under `'any'` and `'explicit'`; the close control is drawn under
      both; declared footer buttons are never affected.
- [x] 1.4 Remove every remaining `dismissable` in the platform, the demo and the example (the shell's
      settings and plugin store rely on the default).
- [x] 1.5 Unit tests on the outlet and service, one per scenario of *Whoever opens a dialog chooses
      how the user may close it*, plus the defaults of the convenience dialogs and of progress.

## 2. A dialog holding unsaved work asks

- [x] 2.1 In the dialog outlet, read the mounted body instance for each open dialog and route scrim,
      Escape, the close control and a declared button without a value through one dismissal request
      that checks the allowed ways, then runs the tab's close guard with the body as the only
      candidate, and closes on approval; a button with a value closes directly.
- [x] 2.2 Ignore further dismissals of a dialog while its request is pending.
- [x] 2.3 Extend the JSDoc of `DirtySurface` to say that a dialog body opened through `open` takes
      part in the same way, and which ways ask.
- [x] 2.4 Unit tests on the outlet, one per scenario of *A dialog holding unsaved work asks before
      the user closes it*: every allowed way asks while dirty, save offered only with a save, a
      failed save keeps it open, clean closes at once, a body implementing nothing closes at once,
      the body closing itself does not ask, a hanging veto offers close anyway, a disallowed way
      asks nothing, a declared button with a value does not ask and one without does.
- [x] 2.5 A testbed dialog in the testbed weaver exercising both an `'explicit'` form and a guarded
      body, so the behaviour can be seen in the running app.

## 3. Documentation

- [x] 3.1 `docs/distribution-api/dialogs-and-toasts.md`: the `dismiss` option with the three kinds of
      editing dialog as examples, the removal of `dismissable` with its mapping, and a dialog body
      taking part in the unsaved-work contract.
- [x] 3.2 `llms-full.txt`: the `OpenOptions` line, the `DialogInstance` line, and the unsaved-work
      contract stated for dialog bodies next to surfaces.
- [x] 3.3 Check `docs/weaver/host-ui-and-facts.md` and `docs/samples.md` for statements the change
      makes wrong.

## 4. Saying it is done

- [x] 4.1 `openspec validate --all --strict`, lint and the shell and plugin-sdk unit suites green.
