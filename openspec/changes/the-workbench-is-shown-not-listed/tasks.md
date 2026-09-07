## 1. The capture, and the pictures to look at

- [x] 1.1 Write `platform/tools/capture-screenshots.mjs`: Playwright's library against the served
      demo, one context per theme at 1280 by 800 and scale two, welcome dismissed, reduced motion,
      a fixed clock, and a list of motifs each with the steps that put the demo into its state.
      `--url` and `--only <motif>` as the tour recorder has them.
- [x] 1.2 The motifs, each waiting for what it opened before it shoots: `plugin-store` (the store
      open on the catalogue with the payment-matching detail beside it), `plugin-consent` (the
      install prompt listing its capabilities), `settings` (the dialog on the Permissions section),
      `workspace-dialog` (the manage dialog with a provided and a saved workspace), `customize-rail`
      (the curation dialog opened from the rail's menu), `tab-menu` (the context menu on a tab),
      `rail-menu` (the context menu on a rail entry), `quick-open` (the palette in its tabs mode
      with several tabs open), `tab-picker` (the picker for a new tab), `unsaved-changes` (the
      prompt after editing a quote and closing it), `split-panes` (two panes from a drag, both with
      content).
- [x] 1.3 A motif the demo cannot reach is recorded here as a finding for the demo, with what is
      missing, and left out of the set rather than faked. Two are left out. **`unsaved-changes`**:
      no surface in the demo reports itself dirty, so nothing ever asks; the demo needs one editable
      view (the quote document is the natural one) before the prompt can be shown.
      **`tab-picker`**: the New tab button opens its list only for content routes hosted at a bare
      path, and every demo route sits under a module (`sales/customers`), so the button opens
      nothing; the demo needs a bare-path route, or the picker needs to offer nested ones, and
      which of the two is a question for the demo's owner, not this change.
- [x] 1.4 Run it, open the pictures, and measure the set. If a file passes half a megabyte, drop the
      scale to one and a half for all of them and run again. At scale two the workspace dialog
      reached 512 kB; the set is captured at one and a half, 18 files, 5.4 MB, largest 336 kB, and
      that is now the script's default.
- [x] 1.5 A line in `docs/reference/operations.md` beside the tour recorder's: what the script
      writes, what it needs, and when to re-run it.
- [x] 1.6 Show the pictures and stop.

## 2. The guide

- [x] 2.1 Write `docs/the-workbench.md`, "The workbench your users get": the derived-from-specs
      header and the block naming `commands`, `plugin-store`, `plugin-permissions`, `workspaces`,
      `shell-layout`, `menus`, `surface-retention`, `panes`, `popout-windows`; one section per motif
      with the picture, its alt text, a caption of one or two sentences, and a link to the page that
      says how to declare or switch it; the agent panel's section reuses the existing picture.
- [x] 2.2 The section on quick open and the tab picker says what the two are, since no page does:
      one searches what is open, the other offers what could be opened, and both list a plugin's
      surfaces without registration.
- [x] 2.3 The table of keyboard shortcuts the shell binds by default, on the guide, each with the
      command it triggers and the page that describes it.
- [x] 2.4 List the guide in `docs/README.md` under Guides after Getting started, and in the pick-your-path
      table as the row for seeing what a product gets.
- [x] 2.5 Add it to `website/sidebar.mjs` after Getting started and to `website/nav.mjs`; build the
      site and run the docs style check, so a long alt text or a dash in a caption fails here and not
      in the pull request. The sync also wanted the page in `llms.txt`, and `llms-full.txt` lists it
      beside the other guides.
- [x] 2.6 Show the page on the site and stop.

## 3. The pictures beside the prose that describes them

- [x] 3.1 `docs/distribution/plugin-store.md` under Entry points: the store; under Consent: the
      consent prompt. `docs/plugins.md` under community-installed: the consent prompt.
- [x] 3.2 `docs/weaver/settings.md`: the settings dialog. `docs/distribution/capabilities.md` under
      The Permissions section: the same picture, with the caption about that section.
- [x] 3.3 `docs/concepts/workspaces.md`: the workspace dialog.
- [x] 3.4 `docs/distribution/workspaces.md` under Curating the rail: the curation dialog, with the
      caption that names *Customize activity bar* and says once that the pages call it the rail.
      `docs/distribution/layout.md` under Curating a sidebar: the same dialog if the frame reads for
      views as well, otherwise none. It does not: the frame lists rail entries, so the layout page
      stays without a picture.
- [x] 3.5 `docs/weaver/menus.md`: the tab menu and the rail menu, with the caption that your entries
      go into these same menus.
- [x] 3.6 `docs/getting-started.md` beside its paragraph on ⌘P: quick open.
- [x] 3.7 `docs/concepts/retention-and-unsaved-work.md`: the unsaved-work prompt. There is no
      picture of it, because the demo cannot show it (see 1.3), so the page stays as it is; the
      guide describes the prompt in words under *What else comes along*.
- [x] 3.8 `docs/reference/shell-anatomy.md` beside the desktop diagram: the split panes.
- [x] 3.9 `docs/ag-ui-agents.md` under Watch a call go through: the agent panel picture the README
      already has.
- [x] 3.10 Run the docs style check and the site build; `llms-full.txt` is regenerated if the guard
      says it must. Both pass; the guard asked for nothing beyond the guide's own entry.

## 4. The landing page and the README

- [ ] 4.1 In `website/src/pages/index.astro`, the `included` items become text with an optional
      motif and anchor; six of them get one: panes, palette and quick open, workspaces, unsaved
      work, the plugin store, auth-aware chrome. An item with a motif renders its light and dark
      picture inside a link to the guide's section, using the same `<picture>` pattern the palette
      section uses.
- [ ] 4.2 `website/src/styles/landing.css`: the checklist grid keeps two columns with the picture
      above or beside the line, and reads on a phone.
- [ ] 4.3 The rungs section gets the consent picture beside its cards, light and dark.
- [ ] 4.4 The new landing files join the explicit list in `website/tools/sync-docs.mjs`; the
      contrast check and the head check still pass.
- [ ] 4.5 `README.md`: the consent picture in its rungs section, with the alt text and the same
      `<picture>` pattern the palette uses there.
- [ ] 4.6 Look at the landing page in both themes and at a phone width, and stop.
