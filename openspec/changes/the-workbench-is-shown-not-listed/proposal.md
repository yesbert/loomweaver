> **Status:** approved.

## Why

The documentation has seventy-two pages and one screenshot. Everything a user sees in a workbench,
the settings dialog, the plugin store and its consent step, the workspace dialog, the two curation
dialogs for the rail and the sidebars, the context menus, quick open and the tab picker, the
unsaved-work prompt, split panes and pop-out windows, is written from the point of view of whoever
declares it or switches it off, never from the point of view of whoever uses it. The claim the README
and the landing page make, *what you would otherwise build twice*, is a list of twelve sentences with
nothing to look at. A reader who wants to know what a product gets for free has to run the demo and
find each dialog by hand, or take the list on trust.

The one screenshot the docs do have, the Quick start's, had to be re-shot for 0.8.2 by hand, and the
tour recorder exists because the first tour was made the same way and could not be re-made. Adding
twenty more pictures by hand would repeat that mistake twenty times.

## What Changes

- **A capture script beside the tour recorder.** It drives the locally built demo with Playwright,
  puts each dialog into a defined state, and writes one still per motif in light and dark to
  `assets/media/`. Nothing in CI runs it; it is re-run when the chrome changes, like the tour.
- **A new guide, "The workbench your users get".** One section per feature, the picture, three
  sentences on what is shown and what was already there, and a link to the how-to page. It carries
  the one table of keyboard shortcuts the docs do not have. It sits in the Guides after Getting
  started and gets an entry in the site's header navigation, because it is the visual on-ramp the
  landing video alone provides today.
- **The same pictures on the pages that already describe the thing.** Each motif is embedded once
  more, on the how-to or concept page whose prose describes that piece of UI, with an alt text that
  says what is visible and a one-sentence caption that carries the page's point. API pages stay
  without pictures.
- **Quick open and the tab picker get a section of their own**, on the new guide, because the docs
  have no paragraph that says what they are, only four half-sentences across four pages.
- **The landing page's checklist becomes its evidence.** Six of the twelve lines in *What you would
  otherwise build twice* get a small picture, light and dark, linking to the guide's section. The
  *Three rungs of trust* section, which talks about the consent dialog in text only, gets that one
  picture. No section is added and the two existing screenshots stay where they are.
- **The README follows the landing page for the rungs picture only**, since GitHub carries fewer
  images well and the README already has three.
- **The site's media guard covers every new file.** The sync already refuses to build when a listed
  file is missing from `assets/media/` and already copies any picture a docs page embeds; the
  landing page's new pictures join the explicit list.

No behaviour changes and no guarantee changes: this is media, one capture tool, one guide, and
embeds on existing pages, so the change declares `skip_specs`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Every dialog and menu shown is already guaranteed by `commands`, `plugin-store`,
`plugin-permissions`, `workspaces`, `shell-layout`, `menus`, `surface-retention`, `panes` and
`popout-windows`. The change shows what those specs state; it does not add to them.

A side finding, recorded so it is not lost: the settings dialog, quick open, the app-reset dialog and
the update badge are named by no specification. That is a gap in the contract, not in this change,
and it gets its own change if it is to be closed.

## Impact

- `platform/tools/capture-screenshots.mjs`, new, and a line for it in
  `docs/reference/operations.md` beside the tour recorder's.
- `assets/media/`: about twelve motifs, each as `<motif>-light.png` and `<motif>-dark.png`.
- `docs/the-workbench.md`, new; `docs/README.md` lists it; `website/sidebar.mjs` and
  `website/nav.mjs` carry it, because the sync fails a docs page absent from the sidebar.
- Embeds on `docs/distribution/plugin-store.md`, `docs/plugins.md`, `docs/weaver/settings.md`,
  `docs/distribution/capabilities.md`, `docs/concepts/workspaces.md`,
  `docs/distribution/workspaces.md`, `docs/distribution/layout.md`, `docs/weaver/menus.md`,
  `docs/getting-started.md`, `docs/concepts/retention-and-unsaved-work.md`,
  `docs/reference/shell-anatomy.md`, `docs/ag-ui-agents.md`.
- `website/src/pages/index.astro` and `website/src/styles/landing.css` for the illustrated
  checklist and the rungs picture; `website/tools/sync-docs.mjs` for the media list; `README.md`
  for the rungs picture.
- `demo/`: unchanged. The script drives what the demo already has; if a motif needs a state the demo
  cannot reach, that is a finding for the demo, not a fixture added here.
- Neighbours, not overlaps: `developer-path-screencast` records a video of the developer's path
  with the same tooling pattern; `the-demo-points-at-the-docs` links from the demo to the docs. This
  change links from the docs to what the demo shows, and the guide is the natural target for those
  pointers once they exist.
