## 1. Pin it

- [x] 1.1 Rail, bar and surface-action specs: an item with a command and a menu on activation is drawn with an empty slot and runs the command; with an entry it opens the menu and does not run the command; a heading naming its own command does not count; `aria-haspopup` follows
- [x] 1.2 The tests were written beside the change rather than before it; the rail case is the one the old code fails by construction, since it hid the item

## 2. Build

- [x] 2.1 `ChromeItemOffers`: for an item and its menu context, whether it is offered and which menu its activation opens
- [x] 2.2 Rail, rail curation, bar, bar item and surface actions use it for drawing, for the menu binding and for the click
- [x] 2.3 Remove the development warning about an ignored action; keep the one about a workspace entry
- [x] 2.4 JSDoc of `MenuTrigger`, `docs/weaver/menus.md` and `llms-full.txt`: the control with an action of its own, with the heading pattern

## 3. Verify

- [x] 3.1 Testbed: a surface action with a command and a slot, end to end with the slot empty and filled
- [x] 3.2 The full shell suite, lint, `nx package shell`, the docs checks, the structure and cycle guards
- [x] 3.3 The full end-to-end suite

## 4. Close

- [x] 4.1 `openspec validate --all --strict`
