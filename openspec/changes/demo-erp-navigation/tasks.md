## 1. The way through, and two modules to try it on

- [x] 1.1 Give the demo a navigation view for the sidebar: it reads which module is active and draws
      that module's areas and their views, marks where the user is, and opens a view in the content
      area on a click.
- [x] 1.2 Turn the rail into the modules: Overview, Sales, Finance, Procurement, Inventory, People,
      each a workspace that holds the navigation view in its left sidebar and remembers its own
      tabs. Areas exist for every module from here on; views arrive with their content.
- [x] 1.3 Move the dashboard to Overview, the module that deliberately has no areas, and decide what
      its sidebar shows instead of a tree.
- [x] 1.4 Build Sales: Customers with a customer list and a contact history, Order handling with the
      existing quotes. The quote list leaves the sidebar and becomes a view the tree points at, and
      the quote document keeps its arrangement.
- [x] 1.5 Put the actions where they belong: *New customer* above the customer list, *Create quote*
      above the quote list, each also a command in the palette.
- [x] 1.6 Every label of the tree in both languages.
- [x] 1.7 Unit tests: the tree draws the active module's areas, marks the open view, and opens a
      view by its address; a module without areas draws no tree.
- [x] 1.8 End-to-end: switching modules from the rail restores what was open in the module returned
      to, which is the thing a menu tree cannot do.
- [ ] 1.9 Show it and stop. Look at Overview and Sales in both themes, with the rail's names on and
      off, before any further module is built.

## 2. Finance, where the tree gets long

- [ ] 2.1 Build the six areas of Finance, with an area folding open and shut, remembering which are
      open, and with the sidebar long enough to scroll.
- [ ] 2.2 Give Receivables, Payables, General ledger, Closing and Dunning their views, with content
      that is small but real.
- [ ] 2.3 Make Payment matching an area holding the sandboxed plugin alone, and answer the open
      question in the design note by looking at it: an area with one child, or a single entry.
- [ ] 2.4 *Start dunning run* is a button in the dunning view and a command, not an entry in the
      tree.
- [ ] 2.5 Unit tests: an area folds and remembers; a module with six areas draws them all; the
      single-child area draws as decided.
- [ ] 2.6 End-to-end: a Finance sidebar that scrolls still reaches its last area, and folding
      survives a switch away and back.
- [ ] 2.7 Show it and stop.

## 3. The remaining three modules

- [ ] 3.1 Procurement: Suppliers and Purchasing, with content that is small but real.
- [ ] 3.2 Inventory: Stock and Movements.
- [ ] 3.3 People: Employees and Payroll.
- [ ] 3.4 The actions of all three beside their content and in the palette, none in the tree.
- [ ] 3.5 Accessibility checks over a module with a folding tree and over one without.
- [ ] 3.6 Look at the whole thing once more at a small window height, where six modules, a long tree
      and the anchored band of the rail compete for room.

## 4. What it taught us

- [ ] 4.1 Record whether the navigation view came out the same for all six modules. If it did, that
      is the case for a platform primitive, and it gets its own change rather than being smuggled in
      here.
