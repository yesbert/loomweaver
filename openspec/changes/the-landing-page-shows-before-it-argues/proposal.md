> **Status:** approved — approved for implementation on 2026-09-08.

## Why

The landing page carries the right facts and puts them in the wrong order. Before the first
picture a reader meets roughly 420 words: an eyebrow, a headline, a four-line lead with six list
items, a further paragraph that mixes the audience, the exclusions, AG-UI, the one-person
maintenance and the pre-1.0 caveat, and three buttons. On a laptop the tour's top edge is all that
is left of the fold. Further down, headings are sentences of up to seventeen words, two sections are
300 and 240 words of prose, and AG-UI appears four times. The page is not long, it has about the
same word count as pages that read as light, but it argues before it shows, and a reader cannot
skim it.

The owner named it on 2026-09-08 after comparing with a page that gets this right: a reader should
know within seconds what this is, what it is for, and how to touch it. The second door on the page
also still says "your own product UI goes through the exact same door a stranger's plugin does",
which is the wording the owner has ruled out for attracting text.

## What Changes

- **The hero shrinks to about sixty words.** A line with the latest release and the licence, the
  headline as it is, one sentence that names the category and the result, one primary action and
  two quiet links. The audience-and-caveats paragraph leaves the page; one sentence of it goes to
  the documentation overview, where the rest already is.
- **The tour sits above the fold**, directly under the hero.
- **Sections become scannable.** Headings shrink to three to five words, and the sentence that was
  the heading becomes the first line under it. Prose sections become card grids where they list
  things: what a product gets, the two AI stories as four cards (`llms.txt` and `llms-full.txt`,
  the MCP server, callable commands, the AG-UI adapter), the CLI's commands as a list. The three
  rungs stay as they are.
- **Cuts.** The two doors go, replaced by the four AI cards; the "everything the user does by hand"
  section moves to the docs where it already lives; "frontend only" becomes one card; the "same
  door" wording is removed from the page and from the README's second door, which carries it too.
- **The header shrinks to Docs, Get started and Demo.** The four documentation entries that all
  lead into the same sidebar go; a Changelog entry arrives with `the-site-has-a-changelog`.
- **Target: about nine hundred words**, from roughly 1750, with nothing said that the docs do not
  say in full.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Marketing and navigation; no platform behaviour. The change declares `skip_specs`.

## Impact

- `website/src/pages/index.astro`, `website/src/styles/landing.css`, `website/nav.mjs`.
- `README.md`: the second door's wording; the README's structure is not changed here.
- `docs/README.md`: one sentence from the hero's audience paragraph.
- The website's own checks (`check-contrast`, `check-head`, lint) stay green.
- No legacy source is dissolved by this change.
