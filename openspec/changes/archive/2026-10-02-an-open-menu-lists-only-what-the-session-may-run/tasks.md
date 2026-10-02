## 1. Pin it

- [x] 1.1 `menu-follows-the-session.spec.ts`: an entry whose command requires a signed-in session is absent while anonymous and present once signed in; a slot whose every entry is refused does not open; a heading leading to a refused command is a plain heading
- [x] 1.2 The same for a pop-out: an entry naming a command without `popout` is absent there
- [x] 1.3 Run them and see them fail on the current code

## 2. Fix

- [x] 2.1 `MenuService`: one read of the commands the session may run, used by `open` and `offers`
- [x] 2.2 `docs/weaver/menus.md`, `docs/weaver/access-gating.md` and `llms-full.txt` say that a menu entry follows its command's access

## 3. Verify

- [x] 3.1 The full shell suite, lint, `nx package shell`, the docs checks
- [x] 3.2 Testbed fixture: a command that requires a signed-in session, contributed to the content tab's menu
- [x] 3.3 End to end in the testbed: that entry is absent signed out and present signed in
- [x] 3.4 The full end-to-end suite

## 4. Close

- [x] 4.1 `openspec validate --all --strict`
