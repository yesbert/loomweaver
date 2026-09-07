## 1. Shaping

- [ ] 1.1 Decide the three questions in design.md, Decisions, with `/opsx:explore`, and write the
      result there
- [ ] 1.2 Where the decision adds a requirement to `scaffolding`, write the delta and remove
      `skip_specs` from `.openspec.yaml`; otherwise record why the existing requirements cover it

## 2. The navigation generator

- [ ] 2.1 Add the recipe under `platform/libs/tooling/devkit/src/recipes`: the declaration with a
      placeholder group, the bridge, the component with the deepest-group retitle, the template,
      and the `registerSurface` call, matching recipe 11 on the samples page
- [ ] 2.2 Offer it from the Nx generator, the CLI and the MCP server from one description, and
      extend the schema parity test
- [ ] 2.3 A test that the output for the documented invocation equals the fenced blocks of recipe
      11, so the generator and the page cannot drift

## 3. The session's verbs

- [ ] 3.1 Extend the `auth-source` recipe with the plugin recipe 12 shows and the provider lines
      for `app.config.ts`, behind whatever option task 1.1 decided
- [ ] 3.2 The same test as 2.3 against recipe 12

## 4. The docs follow

- [ ] 4.1 Move recipes 11 and 12 in the samples page's generator table to written, with their
      invocations
- [ ] 4.2 `docs/scaffolding.md`: the generator in the CLI list, the Nx list, the MCP tool table and
      the option tables; the tooling READMEs the same
- [ ] 4.3 `llms-full.txt`'s tooling line and `llms.txt` where the generator list is named

## 5. Verification

- [ ] 5.1 `npm run quick-start-check` in `platform/` with the new invocations added to what it runs
- [ ] 5.2 `npm run docs-style-check`, `npm run api-docs-check`, `npm run region-ids-check`
- [ ] 5.3 `openspec validate --all --strict`
