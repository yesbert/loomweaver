## Context

See proposal.md. The audit is in the maintainer notes; the framework is Diátaxis: tutorials, how-to
guides, reference and explanation are four needs, and a page that serves two serves neither well.

The weaver guide has 14 second-level and 8 third-level sections, one of which (the content area)
runs to 4,500 words with a dozen bold-led topics and no headings of its own. The distribution guide
has 14 second-level and 21 third-level sections. Thirty-one distinct anchors point into the two from
other files; the site rewrites relative links and fails on a missing file, but does not check anchors.

## Goals / Non-Goals

**Goals:** one task per page; the reasons in concept pages; every existing link and URL still lands
on the right content; the tutorial reads as a tutorial.

**Non-Goals:** no rewriting of prose beyond what a split forces (the style pass is the next slice);
no change to `samples.md`, which is already a how-to collection and becomes the weaver folder's
recipes; no change to the reference area.

## Decisions

**The old files stay as entry pages.** `authoring-a-weaver.md` and `building-a-distribution.md` keep
their names and URLs and shrink to an introduction, the map of the folder and the links every other
page used to carry. Nothing outside the repository breaks, and the thirty-one inbound anchors are
rewritten to the sub-page that holds the section now.

**Pages are cut along the existing headings, and the long content-area section along its bold
topics.** The cut is recorded as a table in `tasks.md`; the script that performs it builds the
heading-to-page map from the same table and rewrites every intra-guide `#anchor` into a cross-page
link. What the automated cut cannot know (a lead sentence for a page, a "where next" footer) is
written by hand afterwards.

**Concept pages are seeded from what exists.** The purposes of the capabilities (`panes`,
`surface-retention`, `workspaces`, `plugin-permissions`) and the explanatory paragraphs of the guides
already say why; the concept pages collect them and link to the how-to pages. They are short on
purpose.

**The tutorial links out instead of explaining.** Each explanatory paragraph in `getting-started.md`
becomes one sentence plus a link into `manual-setup.md`, where the same explanation already stands.

**The sidebar lists every page.** The guard from the previous slice walks sub-folders, so a page
added without a sidebar entry fails the build.

## Risks / Trade-offs

- [An anchor is missed] → the heading map is generated from the files, not typed; a grep for
  `authoring-a-weaver.md#` and `building-a-distribution.md#` after the cut finds only anchors that
  still exist in the entry pages.
- [A page ends up too small to stand alone] → the cut table merges neighbours below about 300 words.
- [Readers who knew the long page lose their scroll position] → the entry page keeps the old order
  as a map, so the old mental model is one click away from every new page.
