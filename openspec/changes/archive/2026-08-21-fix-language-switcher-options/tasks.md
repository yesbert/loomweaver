## 1. Derive the offered languages from the served ones

- [x] 1.1 The switcher takes its options from the served set rather than a second literal list,
  looking up the label and flag per language.
- [x] 1.2 A test adds a served language and asserts the switcher offers it — it must fail against
  the current implementation.

## 2. Pin the cross-window guarantee (F-06)

- [x] 2.1 Add a case to the cross-window suite: changing the language in one window changes it in
  another, without a reload.
