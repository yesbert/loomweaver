> **Status:** approved.

## Why

Everything a reader needs in order to let an agent drive their product is written, and none of it is
where someone would look. The adapter has a reference page, the generator writes the whole connection
behind `--agent`, and Samples carries a recipe for it. What does not exist is a way in: the numbered
guide list runs one to nine and never mentions an agent, so a reader working through it in order
never learns the path exists. Reaching it today means already knowing the words `ag-ui` or `--agent`.

On the landing page the same thing happens in miniature. The adapter is named, but as the fourth item
in a sentence about how many callers one command can have: a button, a shortcut, a palette entry and
an agent tool. That sentence is true and it undersells the claim, because the claim is not "your
command gained a caller". It is that a product can be driven by an agent without writing a transport,
and that the agent cannot exceed what the person at the keyboard could have reached. The second half
is the part a reader is actually worried about, and it is the part this platform can answer.

This is worth doing now because the generator landed. Before it, the honest guide was a list of
things to assemble by hand. Now the guide is short, because most of it is "generate it and read what
came out".

## What Changes

- The documentation gains a **guide** for driving a product with an agent, listed with the other
  guides rather than reachable only from Reference and Samples. It carries the path end to end:
  generate, serve, watch a call go through, replace the one file that stands in for a real agent.
- The landing page gains a **section of its own** for the agent path, stating what it costs to
  build and what an agent may not do. The existing "register the action once" section keeps its
  sentence about the four callers, which is about the command model and remains true.
- The section shows the agent panel mid-run as a **light and dark screenshot pair**, the same form
  the command palette already uses. Deliberately not a second video: the page has exactly one, the
  hero tour, and features are shown as stills. A panel whose content is streaming text also cannot be
  read in a muted, looping clip at that size.
- The section links **into the live demo**, where the panel is docked open in every workspace, so a
  visitor can decline a call themselves and see that the command then does not run.
- The existing entry points name the new guide: the documentation index, `llms.txt`, and the two
  reference pages that already carry the subject.

No behaviour changes and no guarantee is added, altered or removed. This is documentation, a landing
page section and two images.

## Capabilities

### New Capabilities

None. The change declares `skip_specs: true`.

### Modified Capabilities

None. Nothing a consumer could observe about the platform changes: the adapter, the generator and the
demo are all untouched. What changes is where a reader meets them.

## Impact

- `docs/agent-driven-products.md` — new guide. It has to be tracked by git before the site sees it:
  the sync reads its sources from `git ls-files`.
- `docs/README.md` — the guide list and the "Pick your path" table gain the new page.
- `website/astro.config.mjs` — the sidebar's Guides group is hand-kept, so the page is added there or
  it is reachable only through search.
- `website/src/pages/index.astro` — a new feature section with the screenshot pair and the demo link.
- `website/src/styles/landing.css` — only if the new section needs a rule the existing ones do not
  already provide.
- `assets/media/agent-panel-light.png`, `agent-panel-dark.png` — new. Landing media is single-sourced
  here so the README and the site show the same picture; `website/tools/sync-docs.mjs` copies it and
  fails the build on a file it cannot find, so the new pair is named there too.
- `README.md` — the same pair beside the agent claim, as the command palette pair already sits beside
  the command claim.
- `llms.txt` — the curated map names the new guide.
- `docs/reference/agent-tools.md` and `docs/reference/callable-commands.md` — each points at the guide,
  as they already point at one another.

**Accepted by the owner on approval.** `sync-docs.mjs` fails the build when a page under
`docs/reference/` is missing from the sidebar. Guides had no such guard, so this change could have
added a guide that nobody can reach, which is the exact defect it exists to fix. The check is extended
to cover guides as part of this change.

Not affected, and deliberately: `llms-full.txt`. The change that made it carry the adapter in full
shipped as #66; the adapter's content is already there and this change adds no behaviour for it to
describe.

Legacy sources dissolved by this change: none.
