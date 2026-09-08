## Context

See `proposal.md`, Why. What the rewrite has to fit:

- `docs/README.md` is read twice. GitHub surfaces it as the readme of the `docs/` folder, and
  `website/tools/sync-docs.mjs` publishes it as the site's Overview page under `/overview/`.
- The site's sync already upgrades markdown on its way through: it rewrites links, derives
  frontmatter, and expands a fence whose info string is `sh npm` into four package-manager panels.
  A card block is the same kind of upgrade.
- Starlight registers the MDX integration itself when the config does not, the content collection
  already globs `**/*.{md,mdx}`, and `CardGrid` and `LinkCard` ship with it. `LinkCard` takes a
  title, an optional description and the attributes of an anchor.
- `website/generated/` is ignored by git, so nothing the sync writes is ever committed.
- The two documentation guards read files whose name ends in `.md`. The style guard walks `docs/`
  for that suffix; the format guard is handed `docs/**/*.md`.
- The owner has ruled out claims about time or effort saved, and comparisons that name another
  product.

## Goals / Non-Goals

**Goals:**

- A reader who lands on the Overview learns what the platform is for and what is different about it
  before meeting a list of links.
- The same file still reads as prose on GitHub, with no import line and no component markup in it.
- Cards are Starlight's own, so their appearance follows Starlight rather than a stylesheet here.

**Non-Goals:**

- No second argument competing with the landing page. The Overview states the claim in its own
  shorter form and links onward, rather than reproducing the tour.
- No feature inventory. The page says what is different, not everything that is included.
- No MDX anywhere else. Every other page stays markdown, and no page gains a component.
- No card mechanism beyond one block on one page. It generalises only if a second page needs it.

## Decisions

**MDX is what the sync writes, never what an author writes.** The alternative was renaming
`docs/README.md` to `.mdx` and using the components directly. Rejected on three counts. Both
documentation guards select on the `.md` suffix, so the page would silently leave the
forty-word sentence check and the formatting check. GitHub would stop surfacing it as the folder's
readme, and an import line would sit at the top of it as literal text. `llms-full.txt` inlines the
sources, and component markup there is noise for the model that reads it. Writing `.mdx` from the
sync keeps every one of those intact, because the file in the repository stays markdown.

**A card block is a list with an invisible marker.** The source is an HTML comment on its own line
followed by an ordinary markdown list, each item a link and a sentence. GitHub renders the comment
as nothing and the list as a list, which is the correct reading there. The sync recognises the
marker, converts the items into `LinkCard` elements inside a `CardGrid`, and writes the page as
`.mdx` with the one import that needs. A fence with an info string, the mechanism the
package-manager tabs use, was rejected here: a fence renders as a code block on GitHub, and a list
of links is not code.

**The extension is decided per page, by content.** The sync writes `.mdx` only for a page whose
markdown contained a card block, and `.md` for every other. Nothing else in the pipeline changes
shape: link rewriting, the derived description, the sidebar check and the page dates all run before
the extension is chosen.

**The claim is worded once and repeated verbatim.** The landing page, the root readme and the
Overview each carry the sentence that says what the platform is for. Keeping the wording identical
makes a later edit to one of them show up as a disagreement, which is findable, instead of as three
similar sentences that slowly diverge.

**The argument names no duration.** "Why LoomWeaver exists" is built on the questions a workbench
raises late and on an extension surface that leaks when it is added afterwards. It is not built on
how long anything takes to write, which is a claim the owner has ruled out and which an assistant
makes false anyway.

## Risks / Trade-offs

- **MDX parses more strictly than markdown.** A bare `<` or `{` in the body becomes syntax, and a
  future edit could break the build. → The current page has none outside code spans, code spans are
  left alone by MDX, and the site build runs in `npm run check` and in the pull request, so a stray
  brace fails before it ships rather than after.
- **A second page format on the site.** → Authors never see it. It exists only under
  `website/generated/`, which is ignored, and it appears only for a page that asked for cards.
- **The argument and the landing page drift apart.** → The claim sentence is verbatim in three
  places, which turns a drift into a visible contradiction.
- **The task-indexed table survives while the guides list does not.** Detail that lived only in the
  list would be lost. → The rewrite folds what a row lacks into that row, and the guides remain one
  click away in the sidebar, which lists every one of them.
