# @loomweaver/cli

LoomWeaver's scaffolding as a command. It generates weavers, distributions and
integrations into **any** project — no Nx workspace, no LoomWeaver checkout, no AI assistant.

```bash
npx @loomweaver/cli weaver --id notes --command --shortcut 'mod+shift+n' --out src/lib/notes
npx @loomweaver/cli list
npx @loomweaver/cli --help
```

It also validates what the platform parses defensively, which is where mistakes go unreported:

```bash
npx @loomweaver/cli validate-manifest --id notes --capabilities ui,contributions
npx @loomweaver/cli validate-i18n --dir src/lib/notes/src/lib/i18n --strict
npx @loomweaver/cli validate-catalog --file public/plugins/catalog.json --strict
```

The generators are bundled in (`esbuild`, devkit inlined), so there is no transitive install, and the
version matches the platform packages — `loom --version` tells you which `@loomweaver/shell` the output
fits.

## Why this exists next to `@loomweaver/mcp`

Both wrap the same pure core `generate(recipe, input) → FileMap`, so their output is identical. They
differ in who drives:

- **`@loomweaver/cli`** — you pass flags; the CLI writes the files. Scriptable, repeatable, usable in CI.
- **`@loomweaver/mcp`** — you describe what you want; your assistant picks the options and writes the files.

`@loomweaver/devkit` is the third adapter: an Nx generator collection. It is the only one that can change
files as well as write them (it registers the project and adds the tsconfig alias), because Nx hands
it a virtual tree of the workspace. See `docs/scaffolding.md`.

## Guards

- An existing file **stops the run** and is named; `--force` overwrites.
- `--dry-run` lists what would be written — naming any that already exist — and writes nothing.
- A generated path that would escape `--out` is refused — this is the one place in the devkit that
  turns data into files. A symlink inside `--out` is **replaced, never followed**, so `--force`
  cannot write through it onto a file elsewhere.
- An unknown `--flag` fails the run and is named, so a typo cannot silently drop an option.
- Validation warnings report but exit 0; `--strict` makes them fail, for pipelines.

## Build

```bash
nx bundle cli      # → dist/main.mjs (self-contained, executable)
nx test cli
```
