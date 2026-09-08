## 1. The data

- [ ] 1.1 The sync step fetches the release list, with the token when the environment has one,
      and falls back to a one-line note without network; a unit test covers the filtering of
      housekeeping lines and the prerelease marker.
- [ ] 1.2 `.github/workflows/deploy.yml`: the site build step gets the repository token in its
      environment.

## 2. The page

- [ ] 2.1 `changelog.md` written into the generated content: one section per release, newest
      first, version, date, "preview" where applicable, the filtered notes, a link to the release
      on GitHub.
- [ ] 2.2 The page in the sidebar under Overview and in the header as Changelog; `check-head` and
      the sitemap treat it like the other pages, dated from the newest release.
- [ ] 2.3 The landing page's eyebrow reads the latest release from the same data.
- [ ] 2.4 `docs/README.md`: one link to the changelog beside the live demo row.

## 3. Verify

- [ ] 3.1 `npm run check` in `website/` green, with and without the token in the environment.
- [ ] 3.2 The deployed page shows every release from 0.8.x on, with previews marked.
- [ ] 3.3 `openspec validate the-site-has-a-changelog --strict` passes.
