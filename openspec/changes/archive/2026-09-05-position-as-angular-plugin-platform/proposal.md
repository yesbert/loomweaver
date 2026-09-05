> **Status:** approved — approved for implementation on 2026-09-05.

## Why

Somebody searching for what LoomWeaver is finds it late, and once found, reads what it is for us
rather than what it is for them. The site's `<title>` is `LoomWeaver | LoomWeaver`, its meta
description and the GitHub description are the internal architecture sentence ("a domain-agnostic
plugin & UI platform ... zero domain logic"), and none of the three says *Angular*. The bare name
collides with unrelated projects (`loomweave` on PyPI and GitHub), so a search on the name alone
does not reliably land here. The headline, "Build the product. Not the workbench.", presumes the
reader already wants a workbench; the README's first screen has the tour but no code and no list of
the kinds of application this is for.

Two independent reviews of the site and the launch posts arrived at the same diagnosis: the
technical basis is interesting, and the public description does not turn it into a product promise
a visitor understands in five seconds. This change is the cheapest correction: the same one-line
positioning in every place a first contact happens, and the first screen of the README ordered so
that it shows before it argues.

## What Changes

- **One sentence, everywhere a first contact happens.** The qualifier *open-source plugin platform
  for Angular workbenches* becomes the landing page's `<title>`, the site's meta description, the
  GitHub repository description, the first paragraph of `llms.txt`, and the tagline under the logo
  in the README.
- **A new headline and a lead that names what the tour shows.** The landing page and the README
  open with *Build Angular workbenches that grow with your product.* The lead beneath it names the
  concrete things the visitor sees in the tour two seconds later (panes and tabs, the command
  palette, dialogs and settings, theming, a plugin running in its own sandbox) instead of the
  abstract list it names today.
- **The README's first screen shows before it argues.** A short *What can you build* list (admin
  and operations workbenches, internal developer platforms, monitoring consoles, modular business
  applications, products with a plugin idea) and the *who it is for, who it is not for* paragraph
  move directly under the tour. The `registerCommand` example, today the third section, moves up to
  sit next to the Quick start as the first code the reader sees.
- **The seven npm package descriptions say the same thing.** Today `@loomweaver/shell` describes
  itself as "the neutral host chrome as an Angular library" with a dash and the word "domain-pure";
  the registry page is a first contact too. Each description starts with the qualifier and says in
  one plain clause what that package is. They land with the next release.
- **The landing page stops listing frameworks.** Two places say "React, Vue, Svelte or plain JS";
  both become "any framework", the README's phrasing, because scaffolding exists for plain
  JavaScript only.
- **A baseline and one follow-up action.** Before the PR merges, the change records stars,
  referrers and the dev.to article's numbers as the baseline every later marketing change is
  measured against. The day the new first screen is deployed, the owner sends the email to Hacker
  News asking for a review of the flagged Show HN, with the demo link and the new sentence.
- **The argument sections stay.** *Two reasons people pick this up*, AG-UI, the rungs of trust and
  the package table keep their content; they move down one screen, they are not rewritten.

No behaviour changes and no guarantee changes: this is copy, metadata and the order of a README, so
the change declares `skip_specs`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change declares `skip_specs: true`.

## Impact

**Website.** `website/astro.config.mjs` (site description), `website/src/pages/index.astro`
(page title, description, hero headline, lead and fit paragraph).

**Repository front matter.** `README.md` (tagline, first-screen order, new list), `llms.txt` (first
paragraph), the GitHub repository description set through `gh repo edit`, and the `description`
field of the seven `package.json` files under `platform/libs/`.

**Guards.** The docs formatter and the dash checker run on the README and on `docs/`; the landing
page is Astro and is checked by the site build. Nothing new is added to the guards.

**Out of scope.** The guides under `docs/`, the demo application and the tour itself. A second demo that shows the developer's path is its own change,
`developer-path-screencast`; submitting the sentence to curated lists is `awesome-list-submissions`.

**Legacy sources dissolved.** None.
