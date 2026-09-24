## Context

See proposal.md for the motivation. The dialog handle is a class in the SDK that the host constructs
when it opens a dialog and provides to the content by injection; it knows nothing of the host and
closes by settling its result. The host's dialog outlet handles the person's close: it looks up the
mounted content, asks the close guard whether to ask, asks, and closes when approved, and it keeps a
set of dialogs whose question is open so a second Escape does not ask twice. The guard runs the veto
and the question; it is internal to the shell, and without a composed guard nothing asks.

## Goals / Non-Goals

**Goals:**
- The content asks for the same close the close control makes, and learns the outcome.
- One path for the close control, Escape, a click beside the dialog and the content's request.

**Non-Goals:**
- Publishing the close guard. The content asks for a close; it does not run the question itself.
- A request that closes a dialog other than the content's own.

## Decisions

**`requestClose()` on the handle, delegating to a request the host supplies.** The handle takes an
optional close request when the host constructs it and `requestClose()` calls it. Where no host
supplied one, as for a content under test with a bare handle, it closes and resolves `true`, which
is what a dialog with no guard composed does anyway. The handle stays free of host types.
*Alternative considered:* publishing a service the content injects to ask the guard; that exposes
the guard and makes the content responsible for closing afterwards.

**The outlet's dismissal returns its outcome, and the content's request uses it.** The outlet's
existing dismissal is reshaped to return a promise of whether the dialog closed; the close control,
Escape and the click beside still ignore it, and the request returns it. While a question is open,
a further request receives the promise of the question already asked rather than a second question.
The request bypasses the opener's choice of the person's ways, since it does not come from the
person's gesture.

**The service connects the handle to the outlet by the dialog's id.** The service constructs the
handle with a request that finds the dialog instance by its id and hands it to the outlet's
dismissal, through a function the outlet registers with the service when it is created. Without an
outlet (a service used alone in a test), the request closes, as the fallback above.

## Risks / Trade-offs

- [A published class gains a constructor parameter] → It is optional and only the host constructs
  handles, so no consumer's call changes.
- [A request for a dialog that already closed] → The handle is settled; the request resolves `true`
  without asking, as `close()` after closing is a no-op.
