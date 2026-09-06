# loomweaver.dev — documentation site

An [Astro Starlight](https://starlight.astro.build/) site built from the repository's own
documentation. **`docs/` is the single source**: this project never holds a second copy of a page.

```bash
cd website
npm install
npm run dev      # http://localhost:4321
npm run build    # static site into dist/
```

## How the content gets here

`npm run sync` (a `pre` hook of both `dev` and `build`) generates everything under `generated/`:

- every `docs/**/*.md` becomes a page, with frontmatter derived from the file itself: the title from
  its `# Title` heading, the **meta description from its first prose paragraph**, and `lastUpdated`
  from the file's last commit. Nothing is written twice, so no description can describe a page that
  has since moved on — **and a page with no opening paragraph fails the build**, because the
  alternative is shipping the site-wide fallback and saying nothing about itself in a search result
- `docs/README.md` → `/overview/`
- every relative link is rewritten to the route it points at, **and the sync fails if a target
  cannot be resolved** — so renaming a page breaks the build instead of shipping a dead link
- code spans and fenced blocks are left untouched, because some pages describe link syntax in prose
- `llms.txt`, `llms-full.txt`, `LICENSE` and `NOTICE` are copied verbatim into `public/`, and the
  brand assets come from `assets/brand/`: the social card and the square icon set, each of which
  fails the build if it is missing
- `robots.txt` is written here too, naming the AI crawlers the wildcard already allows and pointing
  at `llms.txt`
- `generated/page-meta.json` maps every route to its commit date, which `astro.config.mjs` turns
  into `lastmod` on each sitemap entry; `generated/site-meta.json` carries the version, read from
  `Directory.Build.props` rather than typed a second time

The navigation tree lives in `sidebar.mjs`, beside the config rather than inside it, because two
things read it: `astro.config.mjs` renders it, and `src/components/Head.astro` turns the group a page
sits in into a `BreadcrumbList`. A breadcrumb derived anywhere else would eventually disagree with
the sidebar a reader is looking at. `sync-docs.mjs` fails the build when a page under `docs/` is
missing from that file.

`src/components/Head.astro` adds what Starlight's own head leaves out: the social card
(`og:image` / `twitter:image` — Starlight declares `twitter:card=summary_large_image` and then names
no image), the square icon set, `theme-color`, `og:type: website` on the landing page, and a
JSON-LD graph. Everything in that graph is derived — the version from `Directory.Build.props`, the
date from git, the breadcrumb from `sidebar.mjs` — so none of it can drift from the page it sits on.

`generated/` and `public/` are therefore build output and are gitignored. Edit `docs/`, never the
copies. The landing page is not documentation: it is `src/pages/index.astro` with
`src/styles/landing.css`, and it renders through `StarlightPage` so the header, the search and the
footer stay the site's. Its screenshots and the tour video are single-sourced in `assets/media/`,
copied into `public/media/` by the sync, and a missing one fails the build.

## The pages that are not documentation

`src/pages/imprint.astro` and `src/pages/privacy.astro` are the legal pages. They quote German law
because the operator is in Germany, but they are written in the language this site speaks, like
every other page here. They are not synced from `docs/`, and they stay out of the sidebar and out
of the search index.

`src/components/Footer.astro` overrides Starlight's footer to carry the links to them, and it
renders `ConsentBanner.astro`. The banner is what loads Umami: the analytics script is appended
only once a visitor agrees, the answer is remembered in `localStorage` under `lw-consent`, and both
the footer's "Cookie settings" and the button in the privacy policy take it back.

## The checks

`npm run check` is the whole chain: lint, contrast, build, head. Two of them are new and exist
because what they check is invisible from a page that looks fine in a browser.

- `npm run check-contrast` computes the WCAG ratio of every foreground/background pair the landing
  page and the chrome use, in both themes, and fails below 4.5 for text or 3.0 for a control's
  boundary. Two of those pairs *were* defects — a card aside at 4.49:1 and a button border at
  1.51:1 — and each was one token away from correct, which is exactly how they would come back. It
  also fails when its own copy of the palette stops matching `brand.css`.
- `npm run check-head` reads `dist/`, not the source, because the question is what a crawler is
  served: a description of its own on every page, a social card, an icon set, structured data whose
  `@id` references all resolve, and a `lastmod` on every sitemap entry.

Both run in CI. Note that the workflows check out with `fetch-depth: 0`: page dates come from
`git log`, and on a shallow clone the whole site would claim to have changed on the day it was
deployed.

## The demo is deliberately not indexed

`demo.loomweaver.dev` serves the same empty application shell for every path, so it has nothing to
offer an index. `demo/src/index.html` carries `noindex` — one tag covers the whole unbounded path
space, since every path is that one document — and `demo/public/robots.txt` **allows** crawling.

That combination is not interchangeable with a `Disallow`. Every page of this site links to the
demo, and a URL a crawler is forbidden to fetch but finds linked gets indexed from the link alone:
a bare URL, no snippet, and no way to ever read the `noindex` that would have removed it. Blocking
the crawl is how a page gets stuck in the index, not how it leaves. The post-deploy check asserts
both halves, including that the demo does *not* disallow crawling.

## Licences

`npm run licence-check` gates the site's production dependencies against the same permissive
allowlist the platform packages use. There is exactly one documented exception, explained in
`tools/check-licences.mjs`: the prebuilt libvips binary that Astro's optional `sharp` dependency
pulls in is LGPL, but it is build-time tooling that is never distributed — and the site uses the
passthrough image service, so it never even runs.

## Deployment

`.github/workflows/deploy.yml` publishes this site to the root of loomweaver.dev, and the demo to
demo.loomweaver.dev, on merges to `main` that touch `docs/`, `website/`, `demo/` or the `llms*.txt`
files. It never runs on a pull request, because it holds a deploy key and a fork's run gets no
secrets.

Apache serves the result, so the cache headers are `.htaccess` files the workflow writes: hashed
assets under `_astro/` are immutable, everything the browser has to compare against revalidates.
After uploading, the job asks the live domains what they actually serve — that the site mentions
itself, that the legal pages resolve, that the demo's deep links fall back to `index.html`. A deploy
that reports success while the site is broken is worse than one that fails.
