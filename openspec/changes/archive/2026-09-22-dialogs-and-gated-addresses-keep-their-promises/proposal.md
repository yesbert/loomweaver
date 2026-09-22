> **Status:** approved.

## Why

NextPA found three places in 0.12.2 where the workbench breaks a promise its contract already makes.
A shared or reloaded link below gated content fails and lands at the start address. Escape pressed to
close a select's list inside a dialog closes the whole dialog and loses what was typed. A closed
dialog leaves the keyboard focus on the page body instead of on the control that opened it. None of
them needs a new guarantee; each needs the existing one kept, and a test that holds it.

## What Changes

- **A gated address keeps its sub-address on a cold start** (finding F-032). Content with `access`
  that declares sub-addresses, owns the remainder of its address, or is a container whose children
  carry segments can be opened directly at an address below its root, before the session has
  arrived. Today the router falls through to the access placeholder, which knows no address below
  the root, and the navigation fails. The placeholder accepts the same addresses as the content it
  stands in for, so the address stays, the reason is explained while the session does not qualify,
  and the content opens at that sub-address once it does.
- **Escape closes only what it was pressed in** (finding F-034). An Escape that closes the list of an
  open `<lw-select>` or an open `<lw-menu>` inside a dialog closes that list and nothing else. The
  dialog closes on the next Escape, as it does today.
- **A closed dialog gives the focus back** (finding F-035). However a dialog opened with
  `DialogService.open` closes, the focus returns to the control that had it before, once the dialog
  has left the page. Today the return is attempted while the dialog is still modal, so it has no
  effect.

No new call, option or type. Each behaviour is pinned by a test that fails on 0.12.2.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `access-gating`: *Addressable content is gated at its address, and says why* gains the scenario that
  an address below gated content survives a visit before the session is known, both while the
  session does not qualify and once it does.
- `ui-primitives`: *A dialog holds focus and gives it back* gains the scenario that focus returns to
  the opener however the dialog closes. *Whoever opens a dialog chooses how the user may close it*
  states that an Escape consumed by a list or menu open inside the dialog is not a way of closing
  the dialog, with a scenario.

## Impact

- `platform/libs/core/shell/src/lib/regions/content/routing/content-router.ts`: the access
  placeholder route carries the same child routes as the route it stands in for.
- `platform/libs/core/shell/src/lib/dialog/dialog-outlet.ts`: Escape that something inside the page
  already handled does not dismiss the top dialog.
- `platform/libs/core/shell/src/lib/elements/menu/lw-menu.element.ts`: Escape that dismisses a menu
  marks the key as handled, as `<lw-select>` already does.
- `platform/libs/core/shell/src/lib/dialog/dialog.service.ts`: the focus is returned after the dialog
  has been removed from the page.
- Unit tests beside each of those files. The cold-start deep link is reproduced with the real router
  and a late session in a unit test, so it needs no end-to-end test.
- `platform/libs/core/plugin-sdk/src/lib/content-route.ts` (JSDoc of `access`),
  `platform/libs/core/plugin-sdk/src/lib/dialog.ts` (JSDoc of `dismiss`), `llms-full.txt`,
  `docs/distribution-api/dialogs-and-toasts.md`.
- NextPA findings **F-032**, **F-034** and **F-035**. NextPA's workarounds (no `access` on the
  assistant container, focusing the opener itself after `closed`) can be removed once a release
  carries this.
- Behaviour change without an API change, and only toward what the contract already says: nothing
  that works today stops working. A distribution that relied on one Escape closing both a list and
  its dialog now needs two presses.
