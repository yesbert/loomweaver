## 1. The declaration

- [x] 1.1 An injection token defaulting to empty and a `provide…` function beside the capability
  grants, taking the plugin ids a distribution declares not optional.
- [x] 1.2 Export it from the shell's published surface.

## 2. One answer to whether it runs

- [x] 2.1 `PluginEnablementService` reads the declaration and never reports a declared plugin as
  disabled, so the runtime and the permissions surface cannot disagree.
- [x] 2.2 Test: a plugin in the stored disabled set that is declared not optional is active.

## 3. The surface

- [x] 3.1 A row learns whether it is optional, and the plugin switch is withheld when it is not.
- [x] 3.2 The capability switches stay, gated as they are today on the deployed case alone.
- [x] 3.3 A note saying the plugin is part of the application, in both languages, distinct from the
  note a deployed plugin carries.

## 4. Say when the composition is wrong

- [x] 4.1 In development, report a declared id that names no composed plugin. Inert otherwise, the
  way a grant for an undeclared capability already is.

## 5. Pin it

- [x] 5.1 Tests for each scenario in the delta: no switch, capabilities still switchable, a
  previously disabled plugin returns, and a manifest that claims it changes nothing.
- [x] 5.2 End-to-end: the permissions surface shows the row without its switch.

## 6. Say it exists

- [x] 6.1 `docs/building-a-distribution.md` names the provider, in the intent index and in a section
  of its own, and says what it does and does not withhold. `docs/reference/host-services.md` is about
  injectable runtime services and documents no provider, so it is left alone.
- [x] 6.2 `llms.txt` if the provider belongs in the curated map.

## 7. Close it out

- [x] 7.1 Shell unit suite, `npx nx run-many --target=lint --all`, and the repository's own checks.
- [x] 7.2 `openspec validate --all --strict`.
- [ ] 7.3 Open the pull request naming the report, the shape chosen, and why it is not a manifest field.
