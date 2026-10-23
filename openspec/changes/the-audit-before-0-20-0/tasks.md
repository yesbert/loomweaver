## 1. Security and the plugin store

- [x] 1.1 The install and update consent show the isolation level, and an update that raises it asks again (plugin-sandbox, plugin-store)
- [x] 1.2 An iframe surface address with a `blob:` (or any non-http(s)) scheme is refused (plugin-sandbox)
- [x] 1.3 A catalogue entry's identity has a form and `shell` is reserved, read and read back (delta)

## 2. The agent connection

- [x] 2.1 A call is run only where its command is among the tools offered (delta)
- [x] 2.2 Tool names in the model interfaces' form, translated back on a call, no two alike (delta)

## 3. Persistence

- [x] 3.1 Plugin state: clearing before any write keeps the stored key index; a write before the index is read does not truncate it
- [x] 3.2 Identity-scoped store: a write made while adoption runs is not lost
- [x] 3.3 Persisted setting: a set before an asynchronous store answered is not overwritten by the late stored value

## 4. Accessibility

- [x] 4.1 A tooltip is dismissed by Escape (WCAG 1.4.13)
- [x] 4.2 The minimised pane is named by the title and count it shows
- [x] 4.3 A dialog without a title is named by its message
- [x] 4.4 A tab moved to the other sidebar by keyboard is announced; a rail entry moved by keyboard keeps the focus

## 5. Workbench behaviour

- [x] 5.1 Escape that a menu or dialog handled does not end a maximised pane
- [x] 5.2 A toolbar cell follows its toolbar's context and a same-id override
- [x] 5.3 Close others, all and to the right close closable view tabs in the address-carrying pane too
- [x] 5.4 The pane split handle ends a cancelled drag
- [x] 5.5 Save on hide reports a save that throws or does not return a promise
- [x] 5.6 Uninstalling a disabled plugin removes it from the permissions surface

## 6. Scaffolding and tooling

- [ ] 6.1 The Nx generator schemas refuse an unknown option
- [ ] 6.2 The Nx route keeps a package version the consumer already recorded
- [ ] 6.3 The Nx weaver and distribution generators refuse to overwrite existing files, and every Nx route refuses a target outside the workspace
- [ ] 6.4 `--shortcut` and `--menu` are escaped into generated code
- [ ] 6.5 Composing into `providers` finds the array's own end, and an existing registration is matched as a whole name
- [ ] 6.6 `init` passes arguments to Windows shells safely
- [ ] 6.7 `init` replaces Angular application files only while they are still what `ng new` wrote, and writes into the build project's own root
- [ ] 6.8 No starter spec with `unitTestRunner none`
- [ ] 6.9 The manifest and i18n checks name the consequence of each finding

## 7. Demo, guards and release

- [x] 7.1 The demo shows calendar dates as the dates they are, in every time zone
- [x] 7.2 `command-names-check` reads every shipped command registration
- [x] 7.3 `operations.md` says what `quick-start-check` installs
- [x] 7.4 The release refuses a tag that is not on `main`, pins npm and its actions, and reads the packages from the published table

## 8. Close

- [ ] 8.0 The demo and the example follow the new tool names when they move to 0.20.0; the example's own name translation goes
- [ ] 8.1 Release notes for 0.20.0 name the breaking changes: the agent connection, catalogue identities, the submenu row, `loadTypeScript`
- [ ] 8.2 `openspec validate --all --strict`, then archive
