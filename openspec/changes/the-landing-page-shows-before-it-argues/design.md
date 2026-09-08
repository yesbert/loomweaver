## Context

See `proposal.md`, Why. What the rebuild has to keep and what it has to work with:

- The headline "Build Angular workbenches that grow with your product." and the category sentence
  "An open-source plugin platform for Angular workbenches." are the owner's decisions of
  2026-09-04 and stay. So does the rule that attracting text never says the product is a plugin
  too, in any variant. The lead names only what the tour shows.
- The page is an Astro page rendered through the Starlight page component, with its own stylesheet
  and existing card grids (`door-grid`, `rung-grid`, the checklist). New grids reuse those styles.
- Eight images on the page are lazy; the tour is a theme-aware video with a text transcript.
- No trust block: no logos, stars or quotes until there is a real background for them.
- The primary action stays a button until the CLI's `init` command is published; then it becomes
  the one-line command (`the-cli-has-an-init-command` carries that switch).

## Goals / Non-Goals

**Goals:**

- A first-time reader knows within the first screen what the product is, what it is for, and how
  to start, and sees it running before reading an argument.
- Every section can be skimmed by its heading and its first line alone.
- The page says nothing the docs do not say in full; every card links to its page.

**Non-Goals:**

- No new claims, no new screenshots, no changes to the docs pages the cards link to.
- No changelog page and no Changelog entry in the header; that is `the-site-has-a-changelog`.
- No restructuring of the README beyond the one wording.

## Decisions

**The hero in six lines.** Eyebrow: the latest release tag and the licence, read from the release
list the changelog change will fetch, or hard-coded until then and updated by the bump script.
Headline unchanged. One sentence: the category and the result. Primary button "Start in 5
minutes". Two text links: "Read the docs", "Live demo". Alternative: keep the lead's list of
features (panes, palette, theming, sandbox, store). Rejected for the hero; it becomes the first
card grid, one screen down, where a list can be a list.

**Headings of three to five words, the sentence beneath.** "Register the action once. It is a
button, a shortcut, a palette entry and an agent tool." becomes "One action, every trigger." with
the old heading as its first line. Same for the AG-UI section ("Driven by an agent, safely.") and
the others. The argument is not lost; it stops being the thing a skimmer has to read.

**The two doors become four cards under one heading, "Built for humans and agents".** Cards:
`llms.txt` and `llms-full.txt` (knowledge for an assistant), `@loomweaver/mcp` (its hands), callable
commands (one action, offered to an agent), the AG-UI adapter (a product an agent drives, no
further than the user). Two build-time, two run-time, told apart by a one-line lead. The MCP
config block moves into the assistant guide, which the MCP card links; the landing page keeps one
code block, the command registration. Alternative: shorten the doors and keep them. Rejected: the
doors are where the page turns into an argument, and the bridge sentence under them ("your
contributor onboarding is a URL") is a claim the cards can carry in one line.

**"What you get" is a sticky panel, not a card grid.** Decided by the owner on 2026-09-08 after
seeing the pattern elsewhere: five highlights scroll by on the left, and on the right a panel
sticks to the viewport showing the screenshot that belongs to the highlight nearest the middle of
the screen. The five: panes and tabs, palette and quick open, workspaces, the plugin store with its
consent prompt, settings with permissions. The pictures exist already, light and dark, in "The
workbench your users get"; real screenshots rather than a mock, because the product is recognisable
and the demo is the proof. Sticking is CSS alone; the picture swap is a small intersection observer,
and without scripting the panel shows the first picture. Below the two-column breakpoint the section
is the plain list with each picture under its highlight. The pattern is used once on the page,
because it buys clarity with scroll distance. Frontend-only and the Distribution API become one
line each under the last highlight rather than cards.

**Sections and order.** Hero · tour · "What you get" (the sticky panel) ·
"Still Angular" (short, the one code block) · "Built for humans and agents" (four cards) · "Three
rungs of trust" (as is) · "One CLI" (distribution, weaver, theme, auth-source, validate, one line
each, linking the scaffolding page) · call to action. "Everything the user does by hand" leaves
the page; the Distribution API is linked from the "What you get" grid. "Frontend only, on purpose"
becomes one card in "What you get".

**The header: Docs, Get started, Demo.** The four documentation entries (The workbench, Weavers,
Distributions, Samples) go; they are the sidebar's first screen anyway. Changelog is added by its
own change, so the header does not name a page that does not exist yet.

**The README's second door loses the "same door" sentence.** Replace with the architecture fact
stated where the why is explained: there is no privileged host API, so the published contract
cannot rot. The README is otherwise untouched.

## Risks / Trade-offs

- **The page loses arguments that convinced somebody.** → Each argument survives as a first line
  under a heading or as a card, and the docs carry the full text; the page links, it does not
  repeat.
- **Card grids read as a feature list, which the owner has warned against.** → Cards name a
  result and link a page; no "monate gespart" claims, no superlatives, the owner's register.
- **The contrast and head checks fail on new markup.** → Reuse the existing card styles and the
  existing colour tokens; run the checks before the pull request.
