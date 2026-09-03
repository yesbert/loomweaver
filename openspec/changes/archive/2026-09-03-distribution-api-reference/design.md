## Context

See proposal.md, *Why*. What shapes the approach:

- `docs/reference/host-services.md` (543 lines) carries twenty sections, one per service, plus *Who
  injects what* and *Contributing chrome without a plugin*. Its prose is good; its shape is the
  problem.
- The site (`website/`) syncs every markdown file under `docs/` with `tools/sync-docs.mjs`: nested
  folders become nested routes, relative links are rewritten and any unresolvable link fails the
  build, every page must start with a single `# Title`, and every file under `docs/reference/` must
  appear in the sidebar in `astro.config.mjs` or the build fails.
- `platform/tools/check-api-docs.mjs` requires every published name to appear somewhere in `docs/`,
  `llms.txt`, `llms-full.txt` or `README.md`; it does not care which page.
- The rules the area explains are written down in `CONTRIBUTING.md`, *Shaping the surface*, and the
  guarantees in `host-services`, `gesture-configuration`, `panes`, `workspaces`, `shell-layout`,
  `theming` and `plugin-store`.

## Goals / Non-Goals

**Goals:**

- Lookup by intent: a developer with "I want to …" finds the call in one table and the explanation
  one click away.
- One template, so every page reads the same and a reader knows where to look on it.
- No prose lost, no link broken, no published name left undocumented.

**Non-Goals:**

- No generated API reference from the type declarations. The published-contract check wants prose on
  purpose; a generated listing would satisfy it while explaining nothing.
- No change to the plugin side (`authoring-a-weaver.md`, `plugins.md`, the `ctx` contract).
- No restatement of guarantees: every page keeps the "guide, not the contract" header and points at
  its capabilities.

## Decisions

**A folder, not a longer file.** `docs/reference/distribution/` with `index.md` and one page per
area. The site turns it into `/reference/distribution/` and `/reference/distribution/<page>/`; the
docs index and the guide link to pages, not to anchors in one long page.

**The name is "Distribution API".** "SDK" is taken by `@loomweaver/plugin-sdk`, the plugin side; a
reader who sees "SDK" expects `ctx`. "Distribution" is the word the specifications and the guide
already use for the product's own code.

**`host-services.md` is removed, not kept as an index.** Keeping it would leave two entry points
for one thing. Every link into it is redirected to the new index or to the page that now holds the
section; the sync's link check catches any that is missed, and `llms.txt`/`llms-full.txt` are edited
by hand.

**The pages.** Fourteen, cut by what a distribution wants to do rather than by class:

| Page | Holds |
| --- | --- |
| `index.md` | what the area is, who injects (distribution) and who does not (plugins), the rules, the *I want to …* table |
| `composition.md` | the provider surface indexed by intent, moved from the guide, with a pointer back to each guide section |
| `switches.md` | `FeatureSwitches`, `provideShellFeatures` as the starting value, the three rules |
| `tabs.md` | `ContentTabsService`, the content vs arrangement boundary |
| `panes.md` | `PaneService`, handles, facts |
| `workspaces.md` | `WorkspaceService`, `provideWorkspaces` pointer, what asks and what does not, the boolean |
| `sidebars.md` | `SidebarService` |
| `dialogs-and-toasts.md` | `DialogService`, `NotificationService` |
| `settings.md` | `SettingsService`, `provideSettingsStore` pointer |
| `commands.md` | `CommandService`, `KeybindingService`, `CommandInvocationService`, the palette and quick-open entries, `formatChord`, pointer to callable-commands |
| `session.md` | `AuthContext`, pointer to access-gating |
| `appearance.md` | `ThemeService`, `FontScaleService`, pointers to tokens and icons |
| `plugins-at-runtime.md` | `PluginRuntime`, `PluginEnablementService`, `PluginInstallService`, `PluginStoreService`, `CapabilityGrantService`, pointer to the plugin store guide |
| `windows-and-sync.md` | `PopoutService`, `StateSyncService`, `UpdateService`, `VersionService` |
| `reset.md` | `AppResetService`, the once-asked pair with workspaces |

*Contributing chrome without a plugin* (`provideViews`, `provideBarItems`, `provideRailItems`) goes
to `composition.md`.

**The template.** Every page in this order, so a reader learns it once:

1. `# Title` and the derived-from-specs header naming its capabilities.
2. **Do it**: a code block with the calls, comments naming what each does. First, because it is what
   most readers came for.
3. **Read it**: the facts as signals and what they mean.
4. **What asks**: which actions ask about unsaved work, and that they answer whether they ran where
   they do.
5. **Switched off**: which switches govern the built-in controls for this area, and that the
   service keeps working when they are off.
6. Pointers to the guide sections that tell the story.

A page whose area has no guard or no switch omits that heading rather than filling it.

**The *I want to …* table.** One row per intent, three columns: the intent in the reader's words,
the call (`panes.splitRight()`), the page. Around forty rows, grouped as the pages are. It is the
one place a developer scans; everything else is one click from it.

**The sidebar guard learns to recurse.** `sync-docs.mjs` checks that every synced page is listed in
the sidebar, but it reads the content folder one level deep: a page under `reference/distribution/`
would pass unchecked. The check is extended to walk sub-folders, so the guard keeps meaning what it
says for the new area. That is the one tooling edit in this change.

**Links.** Pages link to each other and to the guide with relative paths, as every other doc does;
the sync rewrites them and fails on a miss, which is the only link check the repository has and
enough.

## Risks / Trade-offs

- [A published name loses its only mention in the move] → `check-api-docs` after packaging fails
  naming it; the redistribution is done section by section so nothing is dropped.
- [A link into `host-services.md` survives somewhere] → the sync fails the site build on the first
  unresolved link; `llms*.txt` are grepped by hand because the sync does not read them.
- [The *I want to …* table drifts from the pages] → It lives on the index next to the pages it
  points at, and every later slice that adds a service adds a row; the reference and the table are
  reviewed in the same PR.
- [Fourteen small pages feel thin on the site] → Each holds what the corresponding section held plus
  the template's headings; thin is the point of a lookup.
