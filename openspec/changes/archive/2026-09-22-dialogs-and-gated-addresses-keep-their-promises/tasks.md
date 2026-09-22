## 1. A gated address keeps its sub-address (F-032)

- [x] 1.1 Test first, in `content-router.spec.ts`: for gated content with sub-addresses, with an owned
  remainder, and as a container whose children carry segments, the access placeholder answers the same
  child addresses as the real route.
- [x] 1.2 Test first, in `a-gated-address-keeps-its-sub-address.spec.ts` (real router, real content
  router, late session): with no session, navigating directly to a sub-address of gated content, or to
  a gated container's child, ends on the placeholder at that address without a navigation error; when
  the session then qualifies, the content is active at that sub-address. Red on 0.12.2 with NG04002.
- [x] 1.3 Give the placeholder route the same child routes as the route it stands in for.
- [x] 1.4 E2E in the testbed if 1.2 cannot reproduce the cold start faithfully. Not needed: 1.2 runs
  the real router and content router with a session that arrives after the first match, and reproduces
  the reported NG04002 exactly.

## 2. Escape closes only what it was pressed in (F-034)

- [x] 2.1 Test first, in `dialog-dismissal.spec.ts`: an Escape whose default was prevented does not
  dismiss the top dialog and does not ask about unsaved work; an unhandled Escape still does.
- [x] 2.2 Test first, in the `<lw-menu>` element spec: Escape that dismisses the menu marks the key as
  handled; confirm the same for `<lw-select>` with a test, since it already does.
- [x] 2.3 Make the outlet ignore a handled Escape, and make `<lw-menu>` mark its Escape as handled.
- [x] 2.4 Test: a dialog body holding an `<lw-select>` with its list open; Escape closes the list and
  the dialog stays; a second Escape closes the dialog.

## 3. A closed dialog gives the focus back (F-035)

- [x] 3.1 Test first, in `a-closed-dialog-gives-the-focus-back.spec.ts` with the outlet rendered:
  a focused button opens a dialog with its own content; after closing by Escape, by the close control
  and by the content's `close`, the focus is on the button once the dialog is gone.
- [x] 3.2 Test: an opener removed from the page while the dialog was open receives no focus and
  nothing throws.
- [x] 3.3 Schedule the focus return for after the render that removes the dialog, and skip it for an
  opener that is no longer connected.

## 4. Hand-over

- [x] 4.1 Say it where it is documented: the `DialogOutlet` doc comment, the `dismiss` description in
  the published dialog types and in `llms-full.txt` (an Escape consumed by an open list or menu does
  not close the dialog), and the `access` description in `llms-full.txt` (sub-addresses survive a
  cold start). Also the `access` JSDoc on the content route and the dialog guide
  `docs/distribution-api/dialogs-and-toasts.md`.
- [x] 4.2 Run `openspec validate --all --strict`, the shell unit suite, the testbed e2e suite, lint
  and the repository's guards including the bundle-size check; reconcile this change's artifacts.
  Testbed e2e: 351 of 352 passed; the one failure (`tab-order.spec.ts`, narrow pane) passes three of
  three alone, with and without this change.
