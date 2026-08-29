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

- every `docs/**/*.md` becomes a page, with frontmatter derived from its `# Title` heading
- `docs/README.md` → `/overview/`
- every relative link is rewritten to the route it points at, **and the sync fails if a target
  cannot be resolved** — so renaming a page breaks the build instead of shipping a dead link
- code spans and fenced blocks are left untouched, because some pages describe link syntax in prose
- `llms.txt`, `llms-full.txt`, `LICENSE` and `NOTICE` are copied verbatim into `public/`, and the
  brand assets come from `assets/brand/`

`generated/` and `public/` are therefore build output and are gitignored. Edit `docs/`, never the
copies. The landing page is hand-written and lives in `landing/index.mdx`.

## The pages that are not documentation

`src/pages/impressum.astro` and `src/pages/datenschutz.astro` are the legal pages, written in
German because that is the language they are owed in. They are not synced from `docs/`, and they
stay out of the sidebar and out of the search index.

`src/components/Footer.astro` overrides Starlight's footer to carry the links to them, and it
renders `ConsentBanner.astro`. The banner is what loads Umami: the analytics script is appended
only once a visitor agrees, the answer is remembered in `localStorage` under `lw-consent`, and
the footer's "Cookie-Einstellungen" and the button in the privacy policy take it back.

## Licences

`npm run licence-check` gates the site's production dependencies against the same permissive
allowlist the platform packages use. There is exactly one documented exception, explained in
`tools/check-licences.mjs`: the prebuilt libvips binary that Astro's optional `sharp` dependency
pulls in is LGPL, but it is build-time tooling that is never distributed — and the site uses the
passthrough image service, so it never even runs.

## Deployment

None yet. The site is built and reviewed locally; hosting and the loomweaver.dev domain are wired up
with the public release.
