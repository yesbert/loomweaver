> **Status:** proposed — not approved for implementation yet.

## Why

The documentation overview indexes three times and argues once, briefly, in a single bold line. It
opens with a claim, spends three paragraphs on definition and caveats, and then lists the same
twelve guides twice: once as the thirteen-row table "Pick your path", once as the numbered list
"Guides". The sidebar beside it lists them a third time. Measured against a page the owner rates
higher, the difference is not decoration:

| Page                       | Words | Height  |
| -------------------------- | ----- | ------- |
| The overview as it stands  | 1187  | 5237 px |
| The page it was read beside | 685   | 2907 px |

A reader who arrives here gets a directory. What the platform is for, and what it does that a
reader would not assume, is never stated as an argument. The caveats land in the third paragraph,
before that reader knows why they would care about them.

## What Changes

- **Two cards open the page**, replacing the thirteen-row table as the first thing under the
  introduction: Getting started, and Building with an AI assistant. The source stays an ordinary
  markdown list, so the file still reads on GitHub; the site's sync renders that list as Starlight's
  own link cards.
- **A section "Why LoomWeaver exists"**, two paragraphs. A product that is a workbench carries
  questions that arrive late: what happens to unsaved work when a pane is hidden, what the address
  bar means with several panes open, what a plugin may reach and what a user can take back. An
  extension surface added after the fact leaks, granting more than was declared or less than is
  needed. The platform answers those before they are met. **No claim about time or effort saved**,
  and no other product named.
- **A section "What is different here"**, four bold lead-ins with a paragraph each: it stays
  Angular; capabilities are default-deny and the user can revoke them; there is no privileged host
  API, so the published contract is the only contract there is; an agent reaches the product's own
  commands rather than only its documentation.
- **One index, not two.** The task-indexed table survives, because it sorts by intent and the
  sidebar does not. The numbered "Guides" list is removed, and whatever a row lacks is folded into
  it.
- **The caveats move to the end**, as a short closing note on where the project stands, still
  stated plainly.
- **The sync learns to emit MDX** for a page that asks for it, so the cards are Starlight's
  components rather than markup this repository styles and then maintains.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The platform guarantees nothing about its own documentation site, and this change adds no
requirement to any capability. It declares `skip_specs`.

## Impact

- `docs/README.md`: rewritten in the shape above. It is the docs folder's readme on GitHub and the
  site's Overview page, so both readings are checked.
- `website/tools/sync-docs.mjs`: emits `.mdx` for the overview and turns the marked list into link
  cards; `website/tools/sync-docs` gains a test for that expansion. Starlight registers the MDX
  integration itself and the content collection already accepts `.mdx`, so no dependency is added.
- `README.md` at the repository root and the landing page carry the same claim in shorter form. The
  wording of the claim is kept identical across the three, so a later edit to one is visible as a
  disagreement rather than a drift.
- No legacy source is dissolved by this change.
