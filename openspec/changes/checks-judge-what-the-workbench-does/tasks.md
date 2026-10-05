## 1. Command check

- [ ] 1.1 Tests first for `true as const`, shorthand and constant ids and titles, destructured and renamed `registerCommand`, `description: undefined`; then the reader
- [ ] 1.2 The command-line walker reads `.js` files; a test with a frame plugin's script

## 2. Manifest and catalogue checks

- [ ] 2.1 A non-kebab id is a convention warning that says the workbench accepts it
- [ ] 2.2 Duplicate ids are judged after parsing; wrong-typed metadata is reported with its consequence

## 3. Option descriptions

- [ ] 3.1 The assistant server's schemas carry `pattern` and `default`; a test compares them with the Nx schema for every scaffold
- [ ] 3.2 The layout option gains its pattern
- [ ] 3.3 The generator collection's descriptions are derived from, or pinned to, the scaffold descriptors

## 4. Guides

- [ ] 4.1 The scaffolding guide describes what each check reads and reports
