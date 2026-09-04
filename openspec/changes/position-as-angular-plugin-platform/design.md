## Context

See proposal.md, *Why*. What shapes the approach:

- Starlight's `title` in `website/astro.config.mjs` renders in the header of every page and is
  the suffix of every page's `<title>` ("Getting started | LoomWeaver"). Making it a sentence
  would put the sentence in every header and every tab.
- The landing page is `website/src/pages/index.astro`, a `StarlightPage` with its own
  `frontmatter.title` and `frontmatter.description`. Those become the landing page's `<title>`,
  `og:title` and meta description independently of the site title.
- The README's `<p align="center">` block under the logo is the text GitHub shows above the fold
  and the text most link previews quote. It is plain HTML, so the markdown formatter leaves it
  alone, but the dash checker still reads it.
- The tour GIF is the first thing after that block. Whatever the lead says, the reader sees the
  tour two seconds later; the lead is a caption for the tour as much as a pitch.
- `llms.txt` opens with a blockquote that an assistant quotes when asked what LoomWeaver is. Today it
  is the architecture sentence, the same one the site and GitHub carry.

## Goals / Non-Goals

**Goals:**

- A search for "Angular plugin platform" or "Angular workbench" has a page whose title matches.
- A visitor who lands anywhere (GitHub, the site, an assistant reading `llms.txt`) meets the same
  sentence, so the second contact confirms the first.
- The README's first screen answers *what is it, what would I build with it, what does the code
  look like* before it explains why.

**Non-Goals:**

- No rewrite of the argument sections of the README, the guides, or the demo. Their content is
  right; only their position on the page changes.
- No new demo material. The tour stays the one visual on the first screen; the developer-path
  screencast is `developer-path-screencast`.
- No change to the brand: the name, the logo and the colours are untouched. The change adds a
  qualifier next to the name, it does not rename anything.

## Decisions

**The qualifier is a fixed string, and it is the same in every place.** "LoomWeaver: open-source
plugin platform for Angular workbenches." That is the `<title>` of the landing page, the GitHub
description and the first words of the `llms.txt` blockquote. The alternative, a slightly different
phrasing per surface tuned to each audience, was rejected: the point is that a searcher who sees the
phrase twice recognises it as the same thing, and one string cannot drift.

**The site title stays the wordmark; the landing page carries the sentence.** Starlight's `title`
remains `LoomWeaver` because it renders in every header, and Starlight appends it to every page's
`<title>` after a pipe. Today the landing page therefore reads `LoomWeaver | LoomWeaver`. Its
`frontmatter.title` becomes "Open-source plugin platform for Angular workbenches" without the
name, so the built title reads `Open-source plugin platform for Angular workbenches | LoomWeaver`
and the one page a search engine ranks for the qualifier is titled with it. The site-wide `description` also becomes the sentence, because it is the
fallback description for every docs page and today is the internal architecture line.

**The headline is taken as proposed; the lead is rewritten to name the tour.** Headline, on the
landing page and in the README: *Build Angular workbenches that grow with your product.* The
proposed lead ("with extensible regions, isolated plugins, commands, dialogs and a consistent
application shell") is correct and abstract. The lead written here names what the tour shows,
without a dash, and is the text to implement unless the owner edits it first:

> An open-source plugin platform for Angular workbenches: an application shell with panes the
> user splits, a command palette, theming, plugins that run isolated in their own sandbox, and
> plugins your users install at runtime. Add tools as your product grows, without touching the
> shell.

The tour's beats are the palette, a split pane, a sandboxed plugin and a re-skin; the lead names
those and adds the one thing a tour cannot show, installation at runtime. It does not name dialogs,
settings or the store, because the reader would look for them in the video and not find them.

The current tagline's second line, "Your domain moves in. So does everyone else's.", is dropped, and
so is every variant of "your own product is a plugin too" in copy meant to attract. It reads as a
demotion: the developer hears that their product is a guest in somebody else's house. The property
behind it (no privileged host API) stays where it is explained, in the argument sections and the
architecture tour, and the lead sells only the outcome. The AG-UI sentence leaves the lead and goes
to the fit paragraph, where the reader who cares about agents already is.

**The README first screen is ordered show, fit, code, argue.** After the logo block: the tour;
*What can you build* (five bullets); the *who it is for, who it is not for* paragraph; Quick start;
the `registerCommand` example under its existing heading; and only then *Two reasons people pick this
up* and the rest in their current order. The alternative, the reviewed proposal's thinner README
with a feature list and no argument, was rejected: the argument sections are what distinguish the
project from any other shell, and a reader who has just seen the tour and the code is the reader
who will read them.

**The "What can you build" list is a list of application kinds, not features.** Admin and operations
workbenches, internal developer platforms, monitoring and data consoles, modular business
applications (ERP and CRM fronts), products that want a plugin ecosystem. A feature list already
exists below (*What you would otherwise build twice*) and is not duplicated.

**"Any framework in a sandboxed iframe", never a list of frameworks.** The reviewed proposal
suggests "React, Vue, Svelte or plain JavaScript plugin bodies". Scaffolding exists for plain
JavaScript only, and framework scaffolding was deferred on purpose. The README's existing phrasing,
"write the plugin body in any framework", is the true statement and stays.

**The landing page says "any framework", as the README does.** Two sentences on the landing page
list React, Vue, Svelte and plain JavaScript. Both become "any framework": scaffolding exists for
plain JavaScript only, and a list invites the reader to look for the React generator.

**The npm descriptions are the qualifier plus one clause.** "LoomWeaver: open-source plugin
platform for Angular workbenches. The shell: chrome, regions, plugin loader and host services." and
likewise for the other six. No dash, no "domain-pure", no internal vocabulary. They ship with the
next release, which is why the task says so rather than promising the registry changes on merge.

**A baseline, once, and a marker on outbound links.** Site analytics loads only after consent, so it
samples a minority; the honest sources are the GitHub traffic API for referrers, the star count,
and the dev.to API for the article. The change records those numbers in its archive note before the
PR merges, so every later marketing change has a before. Links from posts and listings to the site
carry a `?ref=` per channel so the referrer survives.

**GitHub description through the CLI, recorded in the tasks.** `gh repo edit --description` is the
one step outside the repository. It is listed as a task so the change is not archived with the
description still reading the architecture sentence. Topics keep their current set.

## Risks / Trade-offs

- [The new headline is less pointed than "Build the product. Not the workbench."] → It carries
  *Angular*, *workbench* and *grows*, three words the old one presumed. The old line survives as the
  README's `<b>` tagline if the owner wants both; the design assumes the new one replaces it.
- [Two places say the same sentence and one is edited later] → The tasks list every place; a
  `grep` for the qualifier is the check, and the archive note names the string so the next editor
  finds all of them.
- [The dash checker rejects the reviewed proposal's copy verbatim] → Every sentence written here is
  dash-free already; the implementer keeps it that way.

## Open Questions

The outside review raised two points that change copy rather than order, and both are the owner's
call, to be decided before task 2 starts:

- **Whether the fit paragraph names the alternatives.** SCION Workbench is an active Angular
  library that uses the word workbench and splits panes across windows; Luigi and Module Federation
  are the other two things a senior Angular developer will name in the first comment. A short
  "how it compares" paragraph that names them and states what this platform adds (plugins
  installed at runtime behind a consent dialog, a default-deny broker the user can revoke, AG-UI)
  would answer the question before it is asked. Today nothing on the first screen does.
- **Whether the fit paragraph states the project's state plainly.** One maintainer, one star at
  the time of writing, the API still moving on patch releases before 1.0, the demo as the reference
  consumer. The reviewer's argument: the sentence disarms the objection, hiding it does not.

The reviewer also offered a headline with a concrete second half ("Build Angular workbenches. Ship
the plugin system on day one.") for the case that "grow with your product" reads as unfalsifiable.
The owner has chosen the headline as written; the alternative is recorded, not recommended.

## Migration Plan

One branch, one PR. The site deploys from `main`; the GitHub description is set by hand before the
PR merges so the two land together. Rollback is a revert of the PR and a second `gh repo edit`.
