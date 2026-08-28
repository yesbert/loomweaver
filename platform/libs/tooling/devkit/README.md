# @loomweaver/devkit

Dev-time scaffolding + validation for LoomWeaver. Not a runtime package — it is never
imported by `@loomweaver/shell` or a weaver at runtime; it only generates and checks author code.

Install it as a dev dependency of an Nx workspace:

```sh
npm i -D @loomweaver/devkit
```

It is the fullest of the three scaffolding adapters, because Nx hands it a virtual tree of your
workspace: it is the only one that can also *change* files — register the project, add the tsconfig
path alias. `@loomweaver/cli` writes files but knows no workspace; `@loomweaver/mcp` returns a file map and lets
your assistant place it. All three read the same scaffold descriptors, so the generated source is
identical.

Placement is read from your workspace, not assumed: `--directory` (default `libs/<project name>`),
`--import-path` (default: your root manifest's npm scope), `--app` (inferred when the workspace has
exactly one application, an error naming the candidates when it has several), plus `--tags`,
`--prefix` and `--unit-test-runner`.

## Architecture

- **Generation core** (`src/lib/generate`) — a pure `generate(recipe, input) → FileMap` (path →
  content). No filesystem, no Nx, no framework: deterministic and unit-testable. This is the seam a
  CLI or an MCP server wraps later.
- **Recipes** (`src/recipes`) — templates + a typed input per target: `angular-weaver` (a trusted
  in-process weaver) and `frame-plugin` (a framework-agnostic iframe/Penpal plugin — drop
  any framework into `view.html`).
- **Validation core** (`src/lib/validate`) — pure `validateManifest` / `validateI18nParity` /
  `validateCatalog` returning MCP-shaped `Finding[]`. They cover the three places the platform
  swallows a mistake on purpose: an ungranted capability, a missing translation key, and a plugin
  store catalog, which the shell parses defensively — unknown fields, malformed values and whole
  entries disappear without a word.
- **Nx generator adapter** (`src/generators`) — writes a recipe's `FileMap` (plus the Nx project
  files) into the workspace `Tree`.

## Scaffold a weaver

```sh
nx g @loomweaver/devkit:weaver --id=notes --name="Notes"
```

Creates a weaver library at `libs/notes-weaver/` — a manifest, a routable surface, a rail item, i18n
stubs and a test — plus the import alias under your workspace scope, and an assets glob on the
composing application's build so the i18n bundle is served under `/i18n/<id>/`. The generated
`README.md` explains how to wire it into a distribution (`providePlugins`,
`provideCapabilityGrants`, `provideTranslationNamespaces`).

Compose more contributions with flags — the generator assembles the `activate()` body, derives the
required capabilities and adds the matching i18n keys:

| Flag | Adds |
| --- | --- |
| `--command` | a registered command (with a keyboard shortcut) that toasts (→ capability `ui`) |
| `--shortcut=<chord>` | override the command's chord, e.g. `mod+shift+k` (implies `--command`; `mod` = ⌘/Ctrl) |
| `--menu=<slot>` | a menu item in the slot running the command (e.g. `content/tab/context`; implies `--command`) |
| `--bar-item` | a status-bar button that triggers the command (implies `--command`) |
| `--settings` | a settings section (toggle + text) with signal-backed value owners |
| `--about` | an About dialog (reads `ctx.host` version) + a command + a bottom rail item (→ `ui`, `host`) |
| `--instanceable` | named saved instances of the surface (switcher) |
| `--access=<req>` | auth-gate the surface + rail: `authenticated`, `anonymous`, or `role:<name>` |
| `--no-spec` | skip the generated starter unit test |

```sh
nx g @loomweaver/devkit:weaver --id=notes --command --menu=content/tab/context --settings --about --access=role:admin
```

Keyboard chords use the platform-neutral `mod` token (⌘ on macOS, Ctrl elsewhere); the host both
binds and **displays** them per platform (`formatShortcut` → `⌘⇧K` vs `Ctrl+Shift+K`). A literal
`cmd`/`ctrl` in `--shortcut` is rejected with an error pointing at `mod`.

## Scaffold a frame plugin (any framework)

```sh
nx g @loomweaver/devkit:frame-plugin --id=notes --app=loom-testbed
```

Writes an iframe/Penpal plugin (`plugin.html`, `plugin.js`, `view.html`) into
`apps/loom-testbed/public/notes/`. Replace `view.html` with any framework; the generated `README.md`
covers registering it via `provideFramePlugins` and supplying `penpal.global.js`.

## Scaffold a distribution

```sh
nx g @loomweaver/devkit:distribution --name=acme-studio --title="Acme Studio"
nx g @loomweaver/devkit:distribution --name=acme-studio --styles=precompiled   # no Tailwind at all
```

Creates a runnable composition-root app at `apps/acme-studio/` (bootstraps the shell, stylesheet,
PWA manifest, build/serve/lint/test). `nx serve acme-studio` renders the bare shell; the generated
`LOOMWEAVER.md` shows how to add weavers, layout, capability grants and branding — it is named that
so scaffolding over an existing app can never overwrite the app's own `README.md`.

`--styles` decides how the app is styled. The default `tailwind` compiles the shell's source theme,
which is also what lets you write Tailwind utilities of your own. `precompiled` imports the
stylesheet we compiled instead — no `tailwindcss`, no `.postcssrc.json`, no `@source` paths — which
is what you want if the product is themed with Bootstrap, Bulma or hand-written CSS.

## Scaffold backend-integration ports

The platform ships local/anonymous defaults; the product implements two frontend ports against its
own backend. Scaffold either into a distribution's `src/`:

```sh
nx g @loomweaver/devkit:auth-source --name=dev --app=acme-studio       # provider-neutral AuthSource
nx g @loomweaver/devkit:settings-store --name=backend --app=acme-studio # backend-backed settings store
```

Wire them in `app.config.ts` with `provideAuthSource(() => devAuthSource())` and
`provideSettingsStore(new BackendSettingsStore())`.

## Scaffold a theme + a layout

```sh
nx g @loomweaver/devkit:theme --name=midnight --app=acme-studio   # a token-override CSS (@import after ours)
nx g @loomweaver/devkit:theme --name=acme --preset=bootstrap      # the same, mapped onto Bootstrap 5.3
nx g @loomweaver/devkit:layout --app=acme-studio                  # a ShellLayout for provideLayout(baseLayout)
```

`--preset bootstrap` points all 29 `--lw-*` tokens at Bootstrap's `--bs-*` variables instead of
emitting literal colours, so the shell follows your Bootstrap theme live — including its dark mode,
provided you mirror `ThemeService.resolvedTheme()` onto `data-bs-theme`. The generated file says how.

The layout's region ids (`primary` rail, `status` bar) match the weaver defaults, so a scaffolded
weaver's rail + bar items land in it out of the box.
