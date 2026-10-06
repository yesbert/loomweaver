## 1. Command check

- [x] 1.1 Tests first for `true as const`, shorthand and constant ids and titles, destructured and renamed `registerCommand`, `description: undefined`; then the reader
- [x] 1.2 The command-line walker reads `.js` files; a test with a frame plugin's script

## 2. Manifest and catalogue checks

- [x] 2.1 A non-kebab id is a convention warning that says the workbench accepts it
- [x] 2.2 Duplicate ids are judged after parsing; wrong-typed metadata is reported with its consequence

## 3. Option descriptions

- [x] 3.1 The assistant server's schemas carry `pattern` and `default`; a test compares them with the Nx schema for every scaffold
- [x] 3.2 The layout option gains its pattern
- [x] 3.3 The generator collection's descriptions are derived from, or pinned to, the scaffold descriptors

## 4. Guides

- [x] 4.1 The scaffolding guide describes what each check reads and reports
