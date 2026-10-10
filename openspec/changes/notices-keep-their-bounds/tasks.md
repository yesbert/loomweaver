## 0. Inventory

- [x] 0.1 Read the board, the clock, the outlet, the channel and the sanitiser as they are on `main`, and list every helper they already have for identities, timers and wire fields, so that the fixes extend them and add no parallel path
- [x] 0.2 Write the failing tests first and see each one fail against `main`: the repeat and the replacement that keep an isolated plugin's notice, the collision of identities, the hold begun with nothing shown, the focus passing through a notice under a resting pointer, the lifetime beyond a timer, and in the browser the dismissal by pointer with others shown

## 1. The board holds the bounds

- [x] 1.1 A raiser can be bounded in number and in lifetime, and unbounded again; the sandbox runtime bounds a frame plugin when its channel is built and removes the bound when the plugin is deactivated
- [x] 1.2 For a bounded raiser the board turns a stated stay and a longer lifetime into the bound, refuses a further notification beyond the number by throwing, and leaves the running lifetime alone on a repeat and on a replacement
- [x] 1.3 The sanitiser only sanitises and the channel only passes on; the bounds' constants live with the sandbox runtime
- [x] 1.4 A notification is found by its raiser together with the name the raiser gave it, or by the identity the raiser was returned; a taken identity gives the newcomer a generated one, and generated identities skip live ones
- [x] 1.5 A hold does not begin while nothing is shown
- [x] 1.6 A lifetime is capped at what a timer can hold

## 2. The outlet

- [x] 2.1 The outlet records the region the pointer moved on, forgets it on pointer-leave and on a dismissal by pointer, and no longer asks the hover state
- [x] 2.2 A dismissal from the keyboard moves the focus to the neighbouring notification's dismiss control, and the action of a notification runs after the focus has been handed on
- [x] 2.3 The static class lists are in the template; only the placement and the kind's colours are bound

## 3. Names and exports

- [x] 3.1 The internal board, its entries and the lifetime table are named for notifications, the board's verb is show, and what a raiser has on the board is called live; the published declarations are unchanged, checked by the packed-declaration guard
- [x] 3.2 Constants used in one file are not exported, and every boolean query reads as a question
- [x] 3.3 The placement is a table of the six positions, and an unknown position fails at composition with a message naming the six

## 4. Tests

- [x] 4.1 The tests from 0.2 pass, and each was seen to fail before its fix
- [x] 4.2 The sandbox burst test asserts that the fourth and fifth notices were refused, by what the plugin logs, and not only that they are absent
- [x] 4.3 The outlet tests cover focus leaving while the pointer attends, focus leaving while it does not, and the pointer test that dispatched an event nothing listens to is replaced by one that tests something
- [x] 4.4 The end-to-end helper dismisses the startup notice instead of waiting it out

## 5. Documentation and verification

- [x] 5.1 The guide for isolated plugins says that repeating or replacing a toast does not keep it
- [x] 5.2 The composition lookup, the workbench tour, `llms.txt` and `llms-full.txt` name the two notice options
- [x] 5.3 Lint by exit code, every unit test, the packaging and the builds, the bundle ratchet, and the structure, comments, import-cycle, packed-declaration, agent-contract and documentation guards pass
- [x] 5.4 The complete end-to-end suite passes on the branch, and `openspec validate --all --strict` is green

## 6. What the second review found

- [x] 6.1 Attention is remembered per notification and forgotten when that notification is no longer shown; pointer movement and focus on a card that is fading out are ignored; a browser test moves the pointer inside the fade and waits for the others to leave
- [x] 6.2 A notification from a raiser without limits is queued ahead of the first waiting one from a raiser with limits; tests pin the two measured sequences, one plugin behind two of the application's own and two plugins at their limit
- [x] 6.3 Whether a notification is limited is recorded on it, and a notification is found by the identity its raiser was returned also after that identity was taken back
- [x] 6.4 The board's commands and queries are separate: finding a free identity changes nothing, and taking an identity back is its own step
- [x] 6.5 An unknown position is refused for every value that is not absent, the empty string included; the limits' constant is not exported; the placement's boolean reads as a question
- [x] 6.6 The test that asserted a mocked report is replaced by one that pins the removal of the limits at deactivation
- [x] 6.7 Lint, every unit test, the builds, the guards and the complete end-to-end suite pass again
