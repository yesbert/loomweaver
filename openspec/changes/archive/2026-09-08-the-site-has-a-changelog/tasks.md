## 1. The data

- [x] 1.1 The sync step fetches the release list, with the token when the environment has one,
      and falls back to a one-line note without network; a unit test covers the filtering of
      housekeeping lines and the prerelease marker.
- [x] 1.2 `.github/workflows/deploy.yml`: the site build step gets the repository token in its
      environment.

## 2. The page

- [x] 2.1 `changelog.md` written into the generated content: one section per release, newest
      first, version, date, "preview" where applicable, the filtered notes, a link to the release
      on GitHub.
- [x] 2.2 The page in the sidebar under Overview and in the header as Changelog; `check-head` and
      the sitemap treat it like the other pages, dated from the newest release.
- [x] 2.3 The landing page's eyebrow reads the repository's version from the generated site
      metadata, the file the structured data already reads; see the design for why not the release
      list.
- [x] 2.4 `docs/README.md`: one link to the changelog beside the live demo row.

## 3. Verify

- [x] 3.1 `npm run check` in `website/` green, with and without the token in the environment.
- [x] 3.2 The deployed page shows every release GitHub has, v0.9.0-preview.3 to v0.9.2, with the
      previews marked; the 0.8 line predates the release job, so GitHub carries no releases for it.
- [x] 3.3 `openspec validate the-site-has-a-changelog --strict` passes.
