## 1. Descriptions derived from the page

- [x] 1.1 In `website/tools/sync-docs.mjs`, add a `description()` helper beside `frontmatter()`:
      from the body after the title is stripped, take the first prose paragraph — skipping
      blockquotes, HTML comments, fenced blocks, images, headings and list items — flatten its
      markdown (links to their label, code spans to their text, emphasis removed), collapse
      whitespace, and cut at 160 characters on a sentence boundary, falling back to a word boundary
- [x] 1.2 Emit it as `description:` in the generated frontmatter, JSON-stringified like the title
- [x] 1.3 Push a problem when a page yields no usable paragraph, so the sync fails rather than
      shipping the generic fallback
- [x] 1.4 Run `npm run sync` and read every generated description; where one is poor, fix the
      opening paragraph in `docs/`, not the helper
- [x] 1.5 Build and assert that no two pages share a description and that none is the site fallback

## 2. Freshness from git

- [x] 2.1 In `sync-docs.mjs`, read each source document's last commit date with
      `git log -1 --format=%cI -- <path>`, falling back to the file's mtime in a shallow checkout
- [x] 2.2 Emit it as `lastUpdated:` in the generated frontmatter; `docsSchema()` accepts it and
      Starlight renders its own footer from it
- [x] 2.3 Write `generated/page-meta.json` mapping each route to its ISO date
- [x] 2.4 Add `@astrojs/sitemap` as a direct dependency of `website/package.json` and declare it in
      `astro.config.mjs`'s `integrations`, with a `serialize` that reads the map and sets `lastmod`;
      confirm Starlight steps aside rather than adding a second copy
- [x] 2.5 Build and assert every `<url>` in `dist/sitemap-0.xml` carries a `lastmod`
- [x] 2.6 Run `npm run licence-check` — the new dependency is MIT and already in the tree, so this
      is confirmation, not a change to the allowlist

## 3. The social card and the icon set

- [x] 3.1 Draw `assets/brand/social-card.svg` at 1200×630: the icon as a design element, the
      headline, no brand name in an eyebrow position — the cover rule the articles follow
- [x] 3.2 Render it once to `assets/brand/social-card.png` and commit both; nothing renders at
      build time
- [x] 3.3 Add `assets/brand/icon-32.png`, `icon-180.png`, `icon-192.png` and `icon-512.png`,
      scaled from the same master the demo ships. The demo keeps its own copies under
      `demo/public/`: it is a standalone npm project, `assets/brand/` sits outside its workspace
      root, and the Angular builder rejects an asset input from there. Single-sourcing it would mean
      a copy step in the demo's build — risk to a working deploy for tidiness the audit never asked
      for. The two sets come from one master and are byte-identical at 192 and 512
- [x] 3.4 Copy all four into `public/` from `sync-docs.mjs`, failing the build on a missing one, the
      way the tour media already does
- [x] 3.5 Document the new assets in `assets/brand/README.md`

## 4. The head component

- [x] 4.1 Read `website/node_modules/@astrojs/starlight/components/Head.astro` and confirm what the
      default already emits, so nothing is written twice
- [x] 4.2 Create `website/src/components/Head.astro`: render Starlight's default, then append
      `og:image`, `og:image:width`, `og:image:height`, `og:image:alt`, `twitter:image`, the icon
      links (`icon` 32, `apple-touch-icon` 180) and `theme-color`
- [x] 4.3 Override `og:type` to `website` on the landing route
- [x] 4.4 Register it under `components.Head` in `astro.config.mjs`
- [x] 4.5 Point `favicon` at `/icon-32.png`. Removing the option outright does not remove the tag:
      Starlight falls back to `/favicon.svg`, which this site does not ship, so every page 404'd
      for its icon
- [x] 4.6 Point the header logo at a 256px copy of the same mark. It renders about 24px tall and
      was fetching the 1280px master, 110 KB, eagerly on every page — 31 KB now, pixel-identical
      at every device ratio the header can reach

## 5. Structured data

- [x] 5.1 In `sync-docs.mjs`, read `<Version>` from `Directory.Build.props` and write it into
      `generated/site-meta.json`; fail when the element is absent
- [x] 5.2 In `Head.astro`, emit `SoftwareApplication` on the landing route — name, description,
      `applicationCategory`, `operatingSystem`, `license`, `codeRepository`, `programmingLanguage`,
      `softwareVersion` from that file, `offers` at price 0 — alongside `WebSite` and `Organization`
- [x] 5.3 Emit `TechArticle` on a documentation route, with `headline`, `description`, `dateModified`
      from the page's `lastUpdated`, `inLanguage` and `isPartOf`
- [x] 5.4 Build a `BreadcrumbList` from the sidebar group the route sits in; export the sidebar from
      a module `astro.config.mjs` and the component both import, so it is declared once
- [x] 5.5 Validated all 76 pages against the published schema.org vocabulary
      (`schemaorg-current-https.jsonld`): every `@type` exists, every property is declared on the
      type or an ancestor, every `@id` reference resolves inside its own `@graph`. It found three
      real defects, all fixed: `codeRepository` and `programmingLanguage` are properties of
      `SoftwareSourceCode`, not `SoftwareApplication` (now a node of its own, joined by
      `targetProduct`), and `TechArticle.about` pointed at a `#software` node the documentation
      pages did not carry (the application now travels with every page). **Google's Rich Results
      Test was not run** — it needs a browser or a live URL, and neither exists before deploy. Run
      it against loomweaver.dev once this ships

## 6. robots.txt

- [x] 6.1 In `sync-docs.mjs`, extend the written `robots.txt` with an explicit `Allow: /` block for
      `GPTBot`, `ClaudeBot`, `Claude-Web`, `PerplexityBot`, `Google-Extended`, `CCBot` and
      `Applebot-Extended`, keeping the `User-agent: *` block and the `Sitemap:` line
- [x] 6.2 Add a comment line pointing at `https://loomweaver.dev/llms.txt`

## 7. The demo leaves the index

- [x] 7.1 Add `<meta name="robots" content="noindex, nofollow">` to `demo/src/index.html`
- [x] 7.2 Add a `meta name="description"` to the same file, so what is served while it is still
      indexed is not blank
- [x] 7.3 Create `demo/public/robots.txt` that **allows** crawling and names the demo's nature in a
      comment — a `Disallow` would keep the URLs in the index rather than remove them, and the
      design says why
- [x] 7.4 Confirm the built `demo/dist/.../browser/robots.txt` exists, so the deploy's
      `RewriteCond %{REQUEST_FILENAME} !-f` stops sending that request to the shell

## 8. Accessibility

- [x] 8.1 In `website/src/styles/landing.css`, move `.door .aside` from `--sl-color-gray-3` to
      `--sl-color-gray-2` (4.49:1 → 8.57:1 on the card background in the dark theme)
- [x] 8.2 Move the `.lw-landing .btn` border from `--sl-color-gray-5` to `--sl-color-gray-4` and
      verify ≥3:1 against the page background in both themes before writing it
- [x] 8.3 Add `:focus-visible` rules for `.lw-landing .btn`, the consent-banner buttons and the
      footer's legal links: an accent ring with an offset, so it reads over the primary button's
      own fill
- [x] 8.4 In `Footer.astro` and `ConsentBanner.astro`, move focus to the banner's first control when
      `[data-consent-open]` opens it, and return it to the element that opened it on close
- [x] 8.5 Give the tour video's `figure` a text alternative that describes what the recording shows,
      beyond the current caption, for WCAG 1.2.1

## 9. Guards

- [x] 9.1 Add `website/tools/check-contrast.mjs`: compute the WCAG ratio for every foreground /
      background pair the landing page and the footer use, in both themes, and exit non-zero when
      one falls below its threshold (4.5 for text, 3.0 for a control boundary)
- [x] 9.2 Wire it as an npm script and into the build job that already runs the site's checks
- [x] 9.3 Extended `.github/workflows/deploy.yml`'s post-deploy check: `og:image` and `ld+json` on
      the landing page and on a documentation page, `GPTBot` in robots.txt, `<lastmod>` in the
      sitemap, `noindex` in the demo's document, the demo's robots.txt answering as `text/plain`,
      and an assertion that it does **not** disallow crawling
- [x] 9.5 Both workflows now check out with `fetch-depth: 0`. They did not, and `sync-docs.mjs`
      dates every page from `git log`: on a shallow clone the whole site would have claimed to
      change on the day it was deployed — a worse lie than no date at all
- [x] 9.4 Run `npm run lint` in `website/` and fix what it reports

## 10. Verify

- [x] 10.1 Build and re-run the measurements from the audit: unique descriptions per page, `og:image`
      present on every page, JSON-LD present, `lastmod` on every sitemap entry, contrast ratios
- [x] 10.2 Verified what is verifiable without a person at a browser: the `:focus-visible` rules
      ship in the built CSS, and the banner's focus handling is in the served document. **A manual
      keyboard pass was not done** — pressing Tab needs a human. Lighthouse's accessibility audits
      pass at 100, which covers focus-order and focusable-controls but not whether the ring is
      pleasant to use
- [x] 10.3 Lighthouse against the built site, served locally: landing page and `/getting-started/`
      both **SEO 100, Accessibility 100, Best Practices 100**, with no failing audit on either. The
      first run scored accessibility 99 and found one real defect older than this change: the
      header logo carried `alt="LoomWeaver"` inside a link that already reads "LoomWeaver", so a
      screen reader said the name twice. The logo is now decorative
- [x] 10.4 Update `website/README.md`: what the sync now derives, the new guard, and the demo's
      indexing posture with the reason
