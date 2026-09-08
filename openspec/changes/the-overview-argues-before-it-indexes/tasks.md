## 1. The cards, end to end

- [ ] 1.1 `website/tools/sync-docs.mjs`: recognise the card marker, turn the list that follows into
      `LinkCard` elements inside a `CardGrid`, and write the page as `.mdx` with the one import it
      needs. Every other page keeps its extension and its content.
- [ ] 1.2 The card links go through the same rewriting as any other link, so a docs-relative target
      becomes a site route. A card whose target is external stays external.
- [ ] 1.3 A test beside the existing sync tests: the marker produces cards, a list without the
      marker is left alone, and a page without a card block is still written as `.md`.

## 2. The page

- [ ] 2.1 `docs/README.md`: the two cards under the introduction, as a marked markdown list.
- [ ] 2.2 "Why LoomWeaver exists", two paragraphs. The questions a workbench raises late, and an
      extension surface that leaks when it arrives afterwards. No claim about time or effort, no
      other product named.
- [ ] 2.3 "What is different here", four bold lead-ins with a paragraph each: it stays Angular;
      capabilities are default-deny and revocable; no privileged host API, so the published contract
      is the only contract; an agent reaches the product's own commands.
- [ ] 2.4 Remove the numbered "Guides" list and fold what a table row lacks into that row.
- [ ] 2.5 Move the caveats to a short closing note on where the project stands.
- [ ] 2.6 Read the result against `README.md` and the landing page: the claim sentence is worded
      identically in all three, and the Overview argues shorter than the landing page.

## 3. Verify

- [ ] 3.1 Render the page on the site and read it: cards, headings and links, in both themes and at
      a phone width.
- [ ] 3.2 Read `docs/README.md` as GitHub renders it: no import line, no component markup, the card
      list reading as a list.
- [ ] 3.3 `npm run check` in `website/` green; the documentation style and format guards green;
      `openspec validate the-overview-argues-before-it-indexes --strict` passes.
