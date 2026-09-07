## Context

See proposal.md, *Why*. What shapes the approach:

- `platform/tools/record-tour.mjs` drives Playwright's library, not its test runner, against a
  served application, and exists because the first tour was made by hand and could not be re-made.
  It is the precedent for any media this repository commits: produced by a script, re-run when the
  chrome changes, never run in CI.
- The demo is the backdrop. It is deployed from `main` on every merge, so a picture of it matches
  what a reader sees after the click, and its state is fixed: a catalogue with the payment-matching
  plugin, six module workspaces, a quote that can be edited, a docked agent panel. Its end-to-end
  helpers in `demo/e2e/` already know how to open the store, install a plugin and skip the welcome
  dialog, which is the choreography the capture needs.
- `website/tools/sync-docs.mjs` copies any `assets/media/` file a docs page embeds, and keeps an
  explicit list for the landing page; a listed file missing on disk fails the build. The site uses
  `passthroughImageService`, on purpose, so nothing renders an image at build time and no picture
  can rely on optimisation. Files are committed at the size they are shown.
- `platform/tools/check-docs-style.mjs` counts sentences over forty words and dashes used as
  joints in prose, and an image line is prose to it. Every page under `docs/` opens with the
  derived-from-specs header and the block naming its specifications; the index and Getting started
  are the exempt ones.
- The workbench calls the rail *Activity bar* in its own menus, and the docs say *rail*. The
  glossary records this. A picture of the menu puts both words on one page.

## Goals / Non-Goals

**Goals:**

- Every dialog, menu and prompt a product gets without writing it can be seen in the docs, next to
  the prose that already describes it, and in one place as a whole.
- All of it is produced again by one command against the locally served demo, and the result is the
  same every time.
- The landing page shows the same evidence without growing a section.

**Non-Goals:**

- No pop-out window picture. A second browser window is not a still of the workbench; the split
  pane picture carries that section, and the caption says what it shows.
- No crops, no annotations, no arrows drawn on pictures. A full frame shows where a dialog lives,
  which is part of what is being shown; the caption does the pointing.
- No change to the demo. A motif the demo cannot reach is a finding for the demo, recorded in the
  task, not a fixture added to the capture.
- No pictures on the Distribution API pages. They are written for the reader's own code and a
  picture of chrome would answer a question they do not ask.
- No new section on the landing page, and no replacement of the tour, the palette or the agent
  panel pictures.

## Decisions

**A capture script beside the tour recorder, driving the demo.** `platform/tools/capture-screenshots.mjs`,
Playwright's library, one browser context per theme at 1280 by 800 with a device scale of one and a
half, so a dialog stays legible when the page shows the frame at a reader's width and the set
stays under a third of a megabyte per file. The alternative, a
Playwright test with `toHaveScreenshot`, would tie the pictures to the test runner's snapshot
directory and to its per-platform naming, and a snapshot is made to be compared, not shown. The
script writes `assets/media/<motif>-{light,dark}.png` and nothing else, and its motifs are a list in
the file, each a name and a function that puts the demo into the state to photograph.

**Determinism is the script's job, not the demo's.** The context sets the welcome dialog as seen,
the way the end-to-end configuration does, emulates reduced motion so nothing is caught
mid-transition, fixes the clock so the store's relative times ("2 days ago") do not move between
runs, and waits for the dialog it opened before it shoots. What still dates a picture is the version
in the status bar, and that is accepted as it is for the Quick start's picture: the alternative is a
picture of nothing in particular.

**One frame, two uses.** Each motif is one file per theme, embedded on the guide and on the page
whose prose describes it. A docs page embeds both files, the light one with `#gh-light-mode-only`
and the dark one with `#gh-dark-mode-only` on its address: GitHub reads that fragment and shows one
of the two, and the site's stylesheet hides the one that does not match `data-theme`, so the same
markdown follows the reader's mode in both places. A single markdown image per motif, considered
first, left a page mixing themes and could not follow the toggle at all. The landing page uses the
same files as small pictures that link to the guide's section. A second, cropped variant for the landing was considered and rejected: at a
thumbnail the frame is recognisable, and legible is the guide's job, one click away. If a review
finds a thumbnail unreadable, a crop is one clip option in the motif, not a second pipeline.

**Alt text and caption are two texts with two jobs.** The alt text says what is visible, in the
words that are on the screen, and stays under forty words because the style check reads it as a
sentence. The caption is a plain paragraph directly under the picture, one or two sentences, and
carries the point the page is making: what the reader is looking at and that it came with the
shell. "You did not build this" appears at most once per page, so it stays a fact and not a refrain;
on the guide it may be the refrain. The alternative, a caption inside the alt text as Getting
started does today, makes the screen reader read a claim, and a `<figure>` in markdown would need
HTML the sync does not otherwise pass through.

**The guide is a page under `docs/`, with the header every other page has.** It names the
specifications whose behaviour it shows, several of them, in the block at the top. It goes into
Guides after Getting started in `docs/README.md` and `website/sidebar.mjs`, and into
`website/nav.mjs`, whose own comment requires every header link to be in the sidebar as well. The
alternative, a landing-only gallery, would be a second place that describes the workbench and could
drift from the pages that do.

**The captions name the UI's word where the picture shows it.** Where a picture shows *Customize
activity bar*, the caption says so and says once that the pages call it the rail. Nothing in the UI
changes: a menu label a user already knows costs more to change than a sentence, and the glossary
already carries the mapping. The alternative, renaming the menu to *rail*, was rejected for that
reason; the alternative of leaving the caption silent would make the reader notice the mismatch
without an answer.

**The landing checklist grows pictures, not entries.** The `included` list becomes items with an
optional motif; an item with one renders the light and dark picture inside a link to the guide's
section, and the illustrated lines come first as a row of cards above the plain list. Four of the
twelve lines get a picture: panes, palette and quick open, workspaces, and every action as a
service, shown by the tab menu that holds those actions. Unsaved work has no picture because the
demo cannot show the prompt, and auth-aware chrome is a state rather than a dialog. The rungs section gets
the consent dialog beside its three cards, because the third rung describes that dialog in words.
The README gets the consent picture in its own rungs section and nothing else, as the proposal
says.

**The explicit media list in the sync grows only by what the landing page uses.** The docs embeds
are picked up by the link rewrite already; listing them twice would be a second list to keep true.

## Risks / Trade-offs

**A picture ages faster than prose, and the guard only catches a missing file.** → The operations
note says when to re-run the capture, beside the same sentence about the tour, and the guide is the
one place where an outdated set is seen first. Accepted otherwise: the alternative is no picture.

**Twenty-odd PNGs at twice the scale add megabytes to a repository whose tour already weighs eight.**
→ Full frames of flat UI compress well; the number is measured in the first slice and, if a file
passes half a megabyte, the scale drops to one and a half for the whole set rather than per file.

**The demo is a sample product, and the pictures show its words: modules, quotes, an ERP.** → The
captions say "the demo" where the content is the demo's, and the point of every caption is the
chrome around the content, which is the shell's.

**The style check reads the alt text as prose.** → Alt texts stay short and use no dash; the check
runs before the guide is called done.

**The welcome dialog, the agent panel and a theme the demo may add later can change what a frame
shows.** → The script opens each motif from a known route with the welcome dismissed, and the
capture is re-run and looked at whenever the demo's chrome changes, not only the shell's.

## Open Questions

None that change the approach. Two are settled by looking at the first slice and cannot alter it:
whether the settings picture shows the Permissions section or the first section, and which demo
workspace makes the best backdrop for the split-pane frame.
