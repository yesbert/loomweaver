## 1. The recipe, held to the page

- [ ] 1.1 A recipe test that generates `auth-source --name dev` and compares the session source file
      and the plugin file with the fenced blocks of recipe 12 on `docs/samples.md`, read by the path
      comment each block opens with; red until the plugin is written
- [ ] 1.2 Extend the `auth-source` recipe: the plugin file recipe 12 shows, with the name
      substituted, under `src/session/session.plugin.ts`; `--bare` writes the session source alone
- [ ] 1.3 The descriptor gains the `bare` option and a summary that says what the scaffold writes
      now, so the CLI list, the MCP tool list and the scaffolding page change from one source

## 2. Composing it in

- [ ] 2.1 A test on the compose amendment: provider lines with their imports are ensured in the
      composition root's `providers` array, once, beside the plugin registration; a root that no
      longer presents the generated shape is left untouched and the lines are named
- [ ] 2.2 A test that a root already carrying `provideAuthSource` keeps it and is told so, and no
      second one is added
- [ ] 2.3 Extend the compose amendment accordingly, and the routes that apply and describe it
- [ ] 2.4 `auth-source` gains an `amend`: the plugin composed with its grant, `provideAuthSource`
      over the generated source, and `provideIcons` with the two heroicons; nothing under `--bare`
- [ ] 2.5 Schema parity: the option is offered identically by the Nx generator, the CLI and the MCP
      server, and the parity test says so

## 3. The recipes build nightly

- [ ] 3.1 `check-quick-start.mjs` reads recipes 11 and 12 from `docs/samples.md` by their path
      comments and drops the files into the product it scaffolds, with plain surfaces at the routes
      recipe 11 points at
- [ ] 3.2 It runs `auth-source --name dev` there instead of copying recipe 12's plugin, so the
      generator's output is what is built
- [ ] 3.3 In the browser: a choice in the tree navigates and marks the destination, a fold survives
      collapsing and expanding the panel, the stand-in signs in from the rail, and a contribution
      gated on being signed in appears and disappears with it
- [ ] 3.4 The nightly workflow packs what the check needs and nothing more, and its summary line
      names the recipes it built

## 4. The docs follow

- [ ] 4.1 `docs/samples.md`: recipe 12 moves to written in the generator table, with
      `auth-source --name dev` as the invocation, and its lead says the generator writes all of it
- [ ] 4.2 `docs/distribution/auth.md`: the stand-in section says the generator writes the plugin and
      wires the four lines, and names `--bare`
- [ ] 4.3 `docs/scaffolding.md`: the generator's line in the CLI, Nx and MCP lists, and `--bare` in
      the option table
- [ ] 4.4 `llms-full.txt`: the tooling line, and the generator's summary where it is quoted

## 5. Verification

- [ ] 5.1 `nx test devkit cli mcp`, `nx lint` on the three, `npm run agent-versions-check`,
      `npm run region-ids-check`
- [ ] 5.2 `npm run quick-start-check` locally against the packed platform, green with the recipes in
- [ ] 5.3 `npm run docs-style-check`, `npm run docs-format-check`, `npm run api-docs-check`
- [ ] 5.4 `openspec validate --all --strict`
