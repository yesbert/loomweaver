# Website discoverability and access

> **Status:** approved.

## Why

An audit of loomweaver.dev found the site well written and badly published. Seventy-three of its
ninety-one pages share a single meta description, no page carries a social preview image although
every page declares `twitter:card=summary_large_image`, and no page carries a line of structured
data. The launch posts on Reddit, Hacker News and dev.to all point here, and each of them renders
as a bare text card. Beside that sit four measurable accessibility defects, two of them contrast
ratios below the AA threshold this project claims for its own platform.

The `llms.txt` pair is the exception and needs no rescue: it is the strongest thing on the site.
What is missing around it is everything a crawler reads before it decides the page is worth
fetching in full.

## What Changes

**Every page says what it is about.** `sync-docs.mjs` derives a page's description from its first
prose paragraph, the way it already derives the title from the first heading. No source document
gains frontmatter, and no description can drift from the page it describes.

**Sharing a link shows something.** A brand card ships as a static asset and every page references
it as `og:image` and `twitter:image`, with `og:type` corrected to `website` on the landing page.
The card is drawn once and committed; nothing is generated at build time, so the passthrough image
service and the licence allowlist stay as they are.

**Machines learn what LoomWeaver is.** A JSON-LD block on the landing page describes the project as
a `SoftwareApplication` with its licence, repository, version and language; documentation pages
carry `TechArticle` and a `BreadcrumbList` that mirrors the sidebar. The version is read from
`Directory.Build.props` rather than typed a second time.

**The icons are square.** The site currently uses the 1280×1117 brand image as its favicon, at
110 KB, on every page. A proper icon set — 32, 180 and 192 — joins `assets/brand/`, single-sourced
for the site and the demo, which already ships its own copies of exactly these sizes.

**Crawlers are told what changed and who may read it.** The sitemap gains `lastmod` from each
document's last commit. `robots.txt` names the AI crawlers it already allows through `*` and points
at `llms.txt`.

**The demo stops being indexed.** `demo.loomweaver.dev` answers every path with a 200 and an empty
application shell, including `/robots.txt`. It gains a `noindex` in its document head — which, since
the shell answers every path, covers all of them at once — and a real `robots.txt` that keeps
allowing the crawl, because a crawler that is forbidden to fetch the page never reads the `noindex`
that would remove it.

**Four accessibility defects are fixed.** The aside text inside a landing-page card reads 4.49:1
against its own background in the dark theme, one hundredth under AA. The landing page's secondary
buttons draw their border at 1.51:1, against the 3:1 that WCAG 1.4.11 asks of a control's boundary.
No stylesheet in the bundle defines a `:focus-visible` state. Reopening the consent banner from the
footer leaves the keyboard focus where it was.

## Capabilities

### New Capabilities

None. The website is not part of the platform contract, and nothing under `openspec/specs/`
describes it.

### Modified Capabilities

None. `skip_specs: true` is set in this change's `.openspec.yaml`.

## Impact

- `website/tools/sync-docs.mjs` — description derivation, `lastmod` collection, icon copying,
  robots.txt content
- `website/astro.config.mjs` — head entries, sitemap serialisation
- `website/src/components/` — a new head component, focus handling in `ConsentBanner.astro`
- `website/src/pages/index.astro`, `website/src/styles/landing.css` — landing head, contrast, focus
- `assets/brand/` — the social card and the square icon set
- `demo/src/index.html`, `demo/public/robots.txt`, `.github/workflows/deploy.yml` — the demo's
  indexing posture and the `.htaccess` that must not swallow `robots.txt`
- No platform package, no published contract and no specification is touched.
