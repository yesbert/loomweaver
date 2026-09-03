> **Status:** approved.

## Why

A developer building a product on LoomWeaver has one question more often than any other: how do I do
this from my own code? The answer exists, but it is spread out. `docs/reference/host-services.md`
grew during the distribution API work from six to twenty sections and is now an API reference in
everything but name and structure: one long page, ordered by the day the sections were written,
found only by knowing that "host services" is where the answer lives. The provider surface a
distribution composes with sits elsewhere, in a table in the middle of a 1500-line guide.

The owner asked for structured, fast lookup of what can be done programmatically. This change gives
the distribution's API its own reference area, indexed by intent, with one page per area and one
template for every page, so that "I want to split a pane from my toolbar" is a lookup, not a search.

## What Changes

- **A reference area for the distribution's API.** `docs/reference/distribution/` holds an index and
  one page per area. The index states what the area is (what a product's own code may inject and
  call), the rules behind it, and an *I want to …* table that maps intents to `service.method` and
  the page that explains it.
- **One template for every page.** Header naming the capabilities it is derived from; a *Do it*
  code block first; then the facts as signals; then what asks about unsaved work; then which switches
  govern the built-in controls and that the service stays reachable when they are off.
- **The provider surface moves next to the services.** The *Which door does my decision go through?*
  table leaves `building-a-distribution.md` for a composition page in the new area; the guide keeps
  its narrative and points there.
- **`host-services.md` dissolves into the new pages.** Its content is redistributed, nothing is
  dropped, and every link into it is redirected: the docs index, the distribution guide, the
  architecture tour, the plugins guide, the samples page, two reference pages, `llms.txt`,
  `llms-full.txt` and the site's sidebar.
- **The plugin side is untouched.** `authoring-a-weaver.md` and the `ctx` contract keep their shape;
  the same cut for plugin authors is the mirror-image follow-up, not this change.

No behaviour changes and no guarantee changes: this is documentation, so the change declares
`skip_specs`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change declares `skip_specs: true`.

## Impact

**Documentation.** New folder `docs/reference/distribution/` with an index and fourteen pages;
`docs/reference/host-services.md` removed; link updates in `docs/README.md`,
`docs/building-a-distribution.md`, `docs/architecture.md`, `docs/plugins.md`, `docs/samples.md`,
`docs/reference/access-gating.md`, `docs/reference/routing.md`, `llms.txt`, `llms-full.txt`.

**Website.** `website/astro.config.mjs` gains a sidebar group for the area; the docs sync fails the
build for any reference page the sidebar does not list, which is the guard that keeps the two in
step.

**Published-contract check.** Every published name must still appear somewhere under `docs/` or in
the llms files; moving prose between pages keeps that true and the check verifies it after packaging.

**Legacy sources dissolved.** `docs/reference/host-services.md`.
