## 1. The picture, first, because it decides the wording around it

- [x] 1.1 Capture the agent panel mid-run from the deployed demo, in light and in dark, with the
  offered tools, a call and its arguments, the confirmation asking, and the outcome line all in frame.
  Match the dimensions and the crop of the command palette pair so the two sit alike on the page.
- [x] 1.2 Put the pair in `assets/media/` as `agent-panel-light.png` and `agent-panel-dark.png`, and
  name both in the media list in `website/tools/sync-docs.mjs`, which fails the build on a file it
  cannot find.
- [ ] 1.3 Show the pair to the owner before anything is written around it. If the frame does not carry
  the loop, recapture rather than describing what is missing in prose.

## 2. The landing section

- [x] 2.1 Add a feature section to `website/src/pages/index.astro` for the agent path, leading with
  the limit rather than the capability: an agent reaches what the user could have reached, and nothing
  more.
- [x] 2.2 Place the screenshot pair with the same `only-light` / `only-dark` treatment the command
  palette figure uses, and a caption that says what is happening in the frame.
- [x] 2.3 Link to the live demo, where the panel is docked open on arrival, and to the new guide.
- [x] 2.4 Add the same pair to `README.md` beside the agent claim, in the `<picture>` form the command
  palette pair already uses there.
- [x] 2.5 Add only the CSS that the existing section rules do not already provide, and check the
  section in both themes at a narrow width as well as a wide one.

## 3. The guide

- [x] 3.1 Write `docs/agent-driven-products.md`: generate with `--agent`, serve, watch a call go
  through, replace the one file that stands in for a real agent. It states nothing about the adapter's
  own behaviour and links to the reference for that.
- [x] 3.2 Say which commands deserve to be marked consequential, and what the confirmation seam can and
  cannot do — it may narrow what runs, never widen it.
- [x] 3.3 Say plainly how this guide differs from Samples recipe 10, so a reader knows which to read.
- [x] 3.4 `git add` the page before building the site: the sync takes its sources from `git ls-files`.

## 4. Make it reachable

- [x] 4.1 Add the guide to the Guides group in `website/astro.config.mjs`. Nothing checks this for
  guides, so it is its own task.
- [x] 4.2 Add it to `docs/README.md`, both to the numbered guide list and to the "Pick your path"
  table.
- [x] 4.3 Name it in `llms.txt`, which is a curated map rather than a dump, so it goes in the guide
  list and displaces nothing.
- [x] 4.4 Point at it from `docs/reference/agent-tools.md` and `docs/reference/callable-commands.md`,
  as those two already point at one another.

## 5. Accept or strike

- [x] 5.1 Accepted on approval: extend `sync-docs.mjs` so it guards that every guide is linked from
  the sidebar, as it already guards reference pages. Confirm it fails on a guide that is not linked
  before calling it done.

## 6. Close it out

- [x] 6.1 Build the site in `website/`, which rewrites every relative link and fails on one it cannot
  resolve, and confirm the new page and both images are in the output.
- [ ] 6.2 Look at the finished landing page in both themes and confirm the new section reads as its own
  claim rather than as a repeat of the one above it.
- [x] 6.3 Run `openspec validate --all --strict` at the repo root.
