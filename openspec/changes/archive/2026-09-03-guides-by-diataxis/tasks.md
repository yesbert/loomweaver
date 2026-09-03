## 1. Cut the weaver guide into `docs/weaver/`

- [x] 1.1 Pages: `sidebar-surfaces` (Panel surfaces, own custom element), `view-state`,
      `unsaved-changes`, `plugin-state`, `containers` (containers, one item, sub-routes and pop-out),
      `content-area` (routes and tabs, pane edges, preview and pinned tabs, calling ctx from a
      component, panes and tab groups), `sub-routes-and-follows` (subRoutes, rest, follows, switching
      arrangements, activeContent), `menus` (context menus, item menus, pictures, the browser's menu),
      `sandboxed-surfaces` (component or iframe, docked iframe, sandbox bootstrap, frame UI kit),
      `commands` (commands, rail and bar items), `access-gating`, `icons-and-theme`,
      `host-ui-and-facts`, `settings`, `i18n`.
- [x] 1.2 `authoring-a-weaver.md` becomes the entry page: the shape of a weaver, where snippets go,
      the map of pages, samples and concepts.

## 2. Cut the distribution guide into `docs/distribution/`

- [x] 2.1 Pages: `layout`, `content-routing` (routing, following tabs), `workspaces` (unusable,
      telling apart, developer-defined, claiming), `resetting`, `switching-capabilities-off`,
      `surface-retention`, `branding`, `capabilities` (capabilities, required plugin), `auth` (three
      steps), `persistence` (stores, key inventory, identity-scoped), `windows-and-sync` (cross-tab,
      pop-out), `frame-plugins` (frame plugins, UI kit), `plugin-store`, `icons-and-i18n` (icons, i18n,
      rewording), `recomposing-chrome` (recomposing, palette entry, curating settings, dropping a
      route), `pwa`.
- [x] 2.2 `building-a-distribution.md` becomes the entry page: the composition root, which door,
      seeing what you composed, the map of pages.

## 3. Concepts

- [x] 3.1 `docs/concepts/`: `surfaces-and-panes`, `the-address`, `retention-and-unsaved-work`,
      `capabilities-and-trust`, `workspaces`, each short, seeded from the capability purposes and the
      guides' explanatory paragraphs, each linking to the how-to pages that act on it.

## 4. Links, tutorial, maps

- [x] 4.1 Rewrite every intra-guide `#anchor` to the page that holds it, and every inbound anchor from
      other files; `grep` finds no anchor into a section that moved.
- [x] 4.2 `getting-started.md`: each explanatory paragraph becomes a sentence and a link into
      `manual-setup.md`.
- [x] 4.3 `docs/README.md` (guides list and pick-your-path), `llms.txt` (one line per page),
      `llms-full.txt` (file list), the site sidebar (three groups).

## 5. Verify

- [x] 5.1 `website`: sync resolves every link, every page in the sidebar, build passes.
- [x] 5.2 `check-api-docs`: 0 undocumented.
- [x] 5.3 `openspec validate guides-by-diataxis --strict`.
