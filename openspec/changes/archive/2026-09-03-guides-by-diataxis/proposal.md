> **Status:** approved.

## Why

Two pages carry 44 % of the documentation: `authoring-a-weaver.md` (14,000 words) and
`building-a-distribution.md` (17,000). Each is a tutorial, a how-to collection, a reference and an
explanation in one file, ordered by the day its sections were written. A developer who wants to do one
thing scrolls past the reasons; one who wants to understand stumbles over code; one who wants to look
something up finds no shape that matches the task. The documentation audit of 2026-09-03 named this
the largest single finding, and the owner asked for all of its slices to be done.

## What Changes

- **The two guides become folders of how-to pages**, one task per page, 300 to 1,500 words each:
  `docs/weaver/` for plugin authors, `docs/distribution/` for product developers. The old files stay
  as the folders' entry pages, so every existing link and URL keeps working; anchors into moved
  sections are redirected to the page that now holds them.
- **Explanation gets its own place**, `docs/concepts/`: surfaces and panes, the address, retention and
  unsaved work, capabilities and trust, workspaces. The concept pages are short and link to the how-to
  pages that act on them.
- **The tutorial sheds its explanations.** `getting-started.md` keeps the seven steps and the success
  moment, and hands the reasons (the peer-dependency pin, the critical-CSS setting, the orphaned files)
  to `manual-setup.md`, which already explains them, with a link where each stood.
- **The site and the maps follow.** The sidebar gains the three groups; `llms.txt` lists the pages one
  line each instead of one paragraph per guide.

No behaviour changes and no guarantee changes: this is documentation, so the change declares
`skip_specs`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change declares `skip_specs: true`.

## Impact

**Documentation.** About thirty new pages under `docs/weaver/`, `docs/distribution/` and
`docs/concepts/`; the two guides reduced to entry pages; `getting-started.md` trimmed; every inbound
link into a moved section redirected; `docs/README.md`, `llms.txt`, `llms-full.txt` updated.

**Website.** Three sidebar groups; the docs sync's link check and sidebar guard verify the result.

**Published-contract check.** Every published name must still appear somewhere under `docs/`; moving
prose keeps that true and the check verifies it.

**Legacy sources dissolved.** None; the two guide files remain as entry pages.
