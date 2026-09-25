# @loomweaver/cli

LoomWeaver's scaffolding as a command. It takes an Angular application or an Nx workspace to a
running product in one go, and generates weavers, distributions and integrations into **any**
project: no Nx workspace, no LoomWeaver checkout, no AI assistant needed.

```bash
npx @loomweaver/cli init
npx @loomweaver/cli weaver --id notes --command --shortcut 'mod+shift+n' --out src/lib/notes
npx @loomweaver/cli list
npx @loomweaver/cli --help
```

`init` installs the platform, scaffolds the distribution and a first weaver, and says what to serve.
Inside an Angular CLI application a scaffold also wires the workspace around the files it writes:
the style pipeline, the build target, the entry stylesheet, the composition root and any package
the output needs, listing each line it added. Anywhere else it writes the files and names what is
left to wire by hand.

It also validates what the platform parses defensively, which is where mistakes go unreported:

```bash
npx @loomweaver/cli validate-manifest --id notes --capabilities ui,contributions
npx @loomweaver/cli validate-i18n --dir src/lib/notes/src/lib/i18n --strict
npx @loomweaver/cli validate-catalog --file public/plugins/catalog.json --strict
npx @loomweaver/cli validate-commands --dir src/lib/notes
```

The generators are bundled in (`esbuild`, devkit inlined), so there is no transitive install, and the
version matches the platform packages: `loomweaver --version` tells you which `@loomweaver/shell` the
output fits.

## Why this exists next to `@loomweaver/mcp`

Both wrap the same pure core `generate(recipe, input) → FileMap`, so their output is identical. They
differ in who drives:

- **`@loomweaver/cli`** — you pass flags; the CLI writes the files. Scriptable, repeatable, usable in CI.
- **`@loomweaver/mcp`** — you describe what you want; your assistant picks the options and writes the files.

`@loomweaver/devkit` is the third adapter: an Nx generator collection. Because Nx hands it a virtual
tree of the workspace, it also registers the project and adds the tsconfig alias. See
`docs/scaffolding.md`.

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
