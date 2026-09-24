## 1. A quote tab carries its status

- [ ] 1.1 `quotesActions.open` passes a badge from the quote's status: the `quotes.list.status.<status>` key and the list's tone; a unit test in `quotes-actions.spec.ts`
- [ ] 1.2 A demo e2e test: opening a sent quote shows a tab named with its number and "Sent"
- [ ] 1.3 Screenshot of an opened quote, shown to the owner before going on

## 2. The margin can be left out

- [ ] 2.1 A quotes settings section with the toggle "Show margin analysis" (en and de), its value in a signal persisted in local storage, default on
- [ ] 2.2 An effect that calls `ctx.setChildShown('quotes.margin', shown)` at activation and on every change; unit tests
- [ ] 2.3 A demo e2e test: switched off, an open quote draws no margin tab and no padlock and the customer pane takes the room; switched on, the margin returns where it stood
- [ ] 2.4 Screenshots of a quote with the margin shown, left out, and with the padlock for the sales account, shown to the owner before going on

## 3. The quotes list has a context menu

- [ ] 3.1 A right-click on a row opens `ctx.ui.openMenu` with "Open", "Open as preview" and "New quote for this customer" (keys in en and de) through a passthrough on `quotesActions`; unit tests
- [ ] 3.2 A demo e2e test: the menu opens at the row, "Open" keeps the quote as a tab, and the menu changes its words with the language while open
- [ ] 3.3 Screenshot of the open menu, shown to the owner before going on

## 4. The payment matching tab counts what is open

- [ ] 4.1 `view.js` watches `openCount` and sets it whenever the open items load or a decision changes
- [ ] 4.2 `plugin.js` clears `openCount` at activation, fetches the open items for the first count, watches the key and sets or removes the surface badge
- [ ] 4.3 A demo e2e test: the tab shows the count of open items and it drops when a payment is confirmed
- [ ] 4.4 Screenshot of the payment matching tab with its count, shown to the owner

## 5. Close

- [ ] 5.1 `demo/README.md` describes the four
- [ ] 5.2 Demo lint, unit tests, build, bundle size (raise the ceiling deliberately if it grows past it), the demo e2e suite, `openspec validate --all --strict`
- [ ] 5.3 Code review over the change, then archive on the same branch
