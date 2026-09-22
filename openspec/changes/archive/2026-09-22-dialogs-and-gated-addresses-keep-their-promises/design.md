## Context

Three unrelated defects share a change because each is a small repair of a promise the contract
already makes, and all three come from the same NextPA report against 0.12.2. See proposal.md, Why.

**Gated sub-addresses (F-032).** Content with `access` is registered as two routes at the same path:
the real one behind a match guard, and a placeholder that shows the access explanation. Only the real
one carries child routes for declared sub-addresses, container segments and an owned remainder. On a
cold start the session has not arrived, the guard refuses, the router falls through to the
placeholder, and an address below the root has nothing left to match it. When the session state
changes, the content router already re-navigates to the current address, so the recovery path exists;
it just never gets an address to work with.

**Escape in a dialog (F-034).** The dialog outlet listens for Escape on the document. `<lw-select>`
already marks its Escape as handled (it prevents the default); `<lw-menu>` dispatches its dismiss
event and returns without marking anything. The outlet looks at neither.

**Focus after a dialog (F-035).** `DialogService` records the focused element when a dialog opens and
focuses it again in the same turn that removes the dialog from its list. The dialog is still rendered
as a modal at that moment, so everything outside it is inert and the call does nothing.

## Goals / Non-Goals

**Goals:**
- Each repair is pinned by a test that fails on 0.12.2.
- No new public surface: no option, no type, no event.

**Non-Goals:**
- The placeholder for content a distribution removed. It has the same shape and may have the same gap,
  but it is a different requirement and no one has reported it; if the repair here shows it fails the
  same way, it becomes its own change.
- Escape handling for popups a plugin draws itself beyond the convention below. A plugin popup that
  wants the same treatment marks its Escape as handled; nothing more is offered.
- Roving focus in tab strips and rich tooltips (F-033, F-031). Discussed separately.

## Decisions

**The placeholder carries the same child routes as the route it stands in for.** The child list is
computed once per registered route and given to both. Rejected: a catch-all child on the placeholder
only. It would make the placeholder accept addresses the content itself does not answer, so a mistyped
address below gated content would ask the user to sign in and then fail after they did. Mirroring the
children keeps both routes answering exactly the same addresses, and the placeholder's children render
nothing of their own, as the real route's stub children already do.

**The outlet ignores an Escape that was already handled; `<lw-menu>` marks its Escape as handled.**
Rejected: stopping propagation inside the elements. Other document-level listeners (the menu
service's own dismissal, a product's shortcuts) would stop seeing the key, and a propagation stop is
invisible to whoever debugs it later. Checking whether the default was prevented is the web platform's
ordinary signal for "someone consumed this key", `<lw-select>` already sends it, and a plugin-drawn
popup can send it too without any API from us. Rejected as well: the outlet asking whether an
expanded popup exists inside the top dialog. It would have to know every kind of popup, including ones
drawn into the top layer outside the dialog's own subtree.

**Focus returns after the next render, and only to an element still on the page.** The service
schedules the return for after the render that removes the dialog, with its environment injector.
If the recorded element is no longer connected, nothing is focused. Rejected: moving restoration into
the outlet when it sees a dialog disappear. The outlet would need to be handed the trigger it never
saw, and the service is where the trigger is recorded. Stacked dialogs need nothing special: the
trigger of an inner dialog lies inside the outer one, which is the modal again once the inner one is
gone.

## Risks / Trade-offs

- [A distribution relied on one Escape closing a menu and its dialog together] → The contract never
  said so, and the proposal names the change in behaviour. Two presses is what a keyboard user expects.
- [Reproducing the late session in a unit test is awkward] → The router test can register gated
  content with sub-addresses, start with no session and navigate to a sub-address; if the late session
  cannot be simulated faithfully there, an end-to-end test in the testbed covers the cold start.
- [Focus returning one render later lets something else take focus first] → Only the element recorded
  at opening is focused, and only if still connected; if a body deliberately moved focus to a new
  place on the page, that place is outside the closed dialog and the return overrides it, which is
  what the requirement asks.
