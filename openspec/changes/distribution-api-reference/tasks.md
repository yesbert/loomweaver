## 1. The area and its index

- [x] 1.1 Create `docs/reference/distribution/index.md`: what the area is, who injects and who does
      not (moved from *Who injects what*), the rules from *Shaping the surface* in one paragraph
      each, and the *I want to …* table (intent, call, page) covering every action the pages offer.
- [x] 1.2 Create `composition.md` from the guide's *Which door does my decision go through?* tables
      and *Contributing chrome without a plugin*; each row keeps its pointer to the guide section.

## 2. One page per area, one template

- [x] 2.1 `switches.md`, `tabs.md`, `panes.md`, `workspaces.md`, `sidebars.md`, `reset.md` from the
      corresponding sections of `host-services.md`, in the template order (Do it · Read it · What
      asks · Switched off · Guide pointers).
- [x] 2.2 `dialogs-and-toasts.md`, `settings.md`, `commands.md`, `session.md`, `appearance.md`,
      `plugins-at-runtime.md`, `windows-and-sync.md` likewise; `commands.md` also absorbs the palette
      and quick-open entries and `formatChord` where the guide describes them for the distribution.
- [x] 2.3 Every page starts with a single `# Title` and the derived-from-specs header naming its
      capabilities; prose has no dashes.

## 3. Redirect and remove

- [x] 3.1 Replace the guide's door tables with a short pointer to `composition.md`; keep the
      surrounding prose.
- [x] 3.2 Update every link into `host-services.md`: `docs/README.md`,
      `docs/building-a-distribution.md`, `docs/architecture.md`, `docs/plugins.md`,
      `docs/samples.md`, `docs/reference/access-gating.md`, `docs/reference/routing.md`, `llms.txt`,
      `llms-full.txt` (also its *Full docs* file list).
- [x] 3.3 Remove `docs/reference/host-services.md`.
- [x] 3.4 `website/astro.config.mjs`: a sidebar group *Distribution API* listing the index and every
      page; drop the *Host services* entry.
- [x] 3.5 `website/tools/sync-docs.mjs`: the sidebar check walks sub-folders of the content dir, so
      pages under `reference/distribution/` are covered; verify by removing one entry and watching the
      build fail.

## 4. Verify and hand over

- [x] 4.1 `npm run build` in `website/` passes (sync resolves every link, every reference page is
      in the sidebar).
- [x] 4.2 Package the shell and run `check-api-docs.mjs`: every published name still documented.
- [x] 4.3 `grep -rn host-services` across `docs/`, `llms*.txt`, `README.md`, `website/` finds nothing
      but the archive.
- [x] 4.4 `openspec validate distribution-api-reference --strict` passes.
