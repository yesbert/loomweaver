## 1. Pin it

- [ ] 1.1 `menu.service.spec.ts`: an entry whose command requires a signed-in session is absent while anonymous and present once signed in; a slot whose every entry is refused does not open; a heading leading to a refused command is a plain heading
- [ ] 1.2 The same for a pop-out: an entry naming a command without `popout` is absent there
- [ ] 1.3 Run them and see them fail on the current code

## 2. Fix

- [ ] 2.1 `MenuService`: one read of the commands the session may run, used by `open` and `offers`
- [ ] 2.2 `docs/weaver/menus.md`, `docs/weaver/access-gating.md` and `llms-full.txt` say that a menu entry follows its command's access

## 3. Verify

- [ ] 3.1 The full shell suite, lint, `nx package shell`, the docs checks
- [ ] 3.2 End to end in the testbed: a gated entry on a tab's menu, signed out and signed in
- [ ] 3.3 The full end-to-end suite

## 4. Close

- [ ] 4.1 `openspec validate --all --strict`
