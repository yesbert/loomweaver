> **Status:** proposed — not approved for implementation yet.

## Why

The tour on the README and the landing page shows the *user's* path: a workbench already running,
panes, palette, a sandboxed plugin, a theme. Nothing shows the *developer's* path, which is the
claim the Quick start makes in text: a fresh Angular app, three commands, a running product with
its own plugin. A visitor who has decided the workbench looks right still has to take the "five
minutes" on trust or run it themselves. Both reviews of the site named this missing piece, one of
them as the single most important demo. The material exists: the Quick start is the script, and the
tour recorder is the precedent for producing media that can be re-recorded rather than re-made.

## What Changes

- **A second recording, at most ninety seconds, from `ng new` to a running product with a plugin.**
  Terminal first: a fresh Angular app, the install line, `distribution`, `weaver`, `ng serve`.
  Then the browser: the product opens, the weaver's icon is in the rail, its command is in the
  palette and runs. Closing caption: *This is the application shell your product can grow into.*
- **Recorded by a script, like the tour.** A tool beside `record-tour.mjs` runs the Quick start in a
  temporary directory against the published packages, captures the terminal and the browser, and
  writes the same file set the tour has (webm, mp4, gif, poster). Nothing in CI runs it.
- **Placed where the claim is made.** On the landing page after the Quick start section and at the
  top of `docs/getting-started.md` as video; in the README as the poster still linking to the
  site's video, because a ninety-second GIF at the tour's encoding would weigh over ten megabytes
  and GitHub embeds no video. The tour keeps the first screen.
- **The site's media guard covers the new set.** `sync-docs.mjs` refuses to build without the tour
  files; the new files join that list so an outdated or missing screencast fails the build rather
  than shipping a broken figure.

No behaviour changes and no guarantee changes: this is media, one recording tool and its placement,
so the change declares `skip_specs`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change declares `skip_specs: true`.

## Impact

**Tooling.** New `platform/tools/record-quick-start.mjs`; `docs/reference/operations.md` gains
the paragraph that says when and how to re-record it, beside the tour's.

**Media.** `assets/media/quick-start.{webm,mp4,gif}` and `quick-start-poster.jpg`; the existing
`quick-start-light.png` still is replaced by the poster or removed if nothing references it.

**Website.** `website/tools/sync-docs.mjs` (required media list), `website/src/pages/index.astro`
(a figure after the Quick start section).

**Documents.** `README.md` (poster still under the Quick start, linking to the site),
`docs/getting-started.md` (figure at the top).

**Depends on.** `position-as-angular-plugin-platform`: the closing caption and the placement on the
landing page assume its first screen, so this change is implemented after it.

**Legacy sources dissolved.** None.
