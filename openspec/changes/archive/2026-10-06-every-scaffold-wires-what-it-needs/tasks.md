## 1. Amendment kinds

- [x] 1.1 Add `stylesheet-import` and `compose-provider` to the amendment vocabulary, with merge functions in the dev kit and descriptions for the assistant route
- [x] 1.2 Command-line and Nx routes apply both kinds; a provider whose kind is present is named, not added; tests for each route

## 2. Scaffolds

- [x] 2.1 Theme: import after the shell's styles; tests that a generated theme takes effect in a generated distribution
- [x] 2.2 Settings store: provided unless one is; tests for both cases
- [x] 2.3 Layout: provided unless one is; tests for both cases
- [x] 2.4 Frame plugin: served, registered and granted; tests that a generated frame plugin appears in a generated distribution
- [x] 2.5 Assistant route names every step with its cost; the test that asserts the theme "needs nothing" is replaced

## 3. Guides

- [x] 3.1 Scaffolding guide and the four scaffolds' notes describe the wiring as done, and what is named instead when the consumer's own choice is kept
