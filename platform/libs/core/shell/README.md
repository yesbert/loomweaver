# @loomweaver/shell

The neutral shell host (chrome + docking points). Domain-pure: it renders
regions and holds contributions, but knows no product/domain concepts.

## Structure (`src/lib/`) — feature slices, not technical types

The lib is organized in **vertical feature slices**: each folder holds everything one
feature needs (service + UI + contracts + specs). There are no `services/` or
`components/`-style type buckets (current Angular style guide: "avoid creating
directories like components, directives, and services").

- **`shell.*` / `provide-shell.ts` / `host-commands.ts` / `built-in-menus.ts` / `default-settings.ts`** — root
  component + DI composition entry (`provideShell({ omit })`).
- **`layout/`** — the declarative region-agnostic model (`layout`, its queries, the
  panel widths) + viewport breakpoint service.
- **`regions/`** — the docked region renderers: `bar/` (incl. shell
  brand), `rail/`, `panel/`, `pane/`, `content/`, `reorder/`, plus `curation/`, `reset/`
  and `reveal/` for what acts across regions. Each region owns its component **and** its
  contribution contract (`bar-item`, `rail-item`). `content/` is sub-sliced into
  `routing/` (router wiring, the route table, reuse strategy), `surface/` (what draws a
  surface inside a pane), `tabs/` (tab state, projection, close hooks, context menu) and
  `access/` (auth gating + placeholder views); the address pane and shared path helper
  live at its root.
- **`plugin/`** — plugin runtime core: `plugin`, `plugin-runtime`, `plugin-state.service`,
  `contribution-registry` (id-keyed: same id overrides, `remove*ById` — except content
  routes, which override by `path`; their `id` is the `route:` omit handle). Sub-sliced into
  `context/` (the `ctx` a plugin receives), `frame/` (the frame rung: runtime, RPC, settings)
  and `enablement/` (turning a plugin on and off, and the permissions settings section).
- **`commands/`** — command registry + keybindings + command palette.
- **`plugin-store/`** — community plugin store: catalog port, install/deployment/store
  services and the complete store UI.
- **`permissions/`** — capability grants, their broker and refusal reporting.
- **`settings/`** — settings model + service + dialog + row primitives.
- **`persistence/`** — shared kernel: the two `KeyValueStore` ports (`SETTINGS_STORE`
  settings-only + `WORKING_STATE_STORE`), cross-tab sync (`StateSyncService`),
  identity scoping, `hydrate`/`readStoredValue` and id-set parsing. Deliberately
  cross-cutting (consumed by plugin/, regions/ and the feature slices).
- **`elements/`** — the framework-agnostic `<lw-*>` custom-element family
  incl. the icon registry; `lw-elements.frame.ts` is the `@loomweaver/frame-kit` bundle
  entry. Deliberately cross-cutting (the host UI kit).
- **Small feature slices** — `theme/`, `text-size/`, `i18n/` (loader + locale service +
  switcher + translations), `auth/`, `dialog/`, `notifications/`, `menu/`, `version/`,
  `update/`, `workspace/`, `views/` (the `View` contribution, named view instances +
  `VIEW_STATE`).
- **`styles/`** — design tokens + theme (see `docs/reference/design-tokens.md`).

The published API is the `src/index.ts` barrel only; consumers never deep-import.

## Tests

Run `nx test shell` to execute the unit tests.
