## Context

See `proposal.md`, Why. What the page has to work with:

- The release workflow creates each GitHub release with generated notes starting from the previous
  tag, and marks previews as prereleases. The notes are a bullet list of pull request titles with
  links, followed by a compare link. There is no `CHANGELOG.md`, by decision recorded in the
  workflow.
- Pull request titles follow `<type>: <sentence>`; `chore(openspec): archive …` and
  `chore: bump version to …` are the housekeeping entries.
- The site is built by `sync-docs.mjs` plus Astro; the deploy job runs `npm run build` in
  `website/` without a token today. The three hand-written pages are dated from their own source.
- The landing page eyebrow today carries static text; the README carries a release badge.

## Goals / Non-Goals

**Goals:**

- A visitor sees, from the header, that the project ships, and what changed, without leaving the
  site.
- The page needs no maintenance beyond releasing: nothing is written twice.

**Non-Goals:**

- No hand-written release prose. If a release deserves a story, that is a docs page or an article.
- No feed beyond the sitemap for now; an RSS feed is a later addition if anyone asks.

## Decisions

**Generated at site build from the GitHub release list, not from git tags or from a file.** The
release list is the one source that carries version, date, prerelease flag and notes together,
and it is written by the release workflow that already exists. Alternative: a `CHANGELOG.md` kept
by hand or by a changeset tool. Rejected: the repository decided against a second list when the
release job was written, and the pull request titles are already sentences. Alternative: read the
tags and the merged pull requests from git at build time. Rejected: the deploy checkout is
shallow and has no pull request data.

**Fetched in the sync step, written as a generated page.** The sync script already writes
`generated/docs/`; it gains one fetch of `/repos/yesbert/loomweaver/releases` with the token from
the deploy environment, and writes `changelog.md` into the generated content with the same
frontmatter shape as the other pages. Locally without a token the fetch is unauthenticated and rate
limited but works; without network the page is written with a one-line note and the build does not
fail, because a docs build must not depend on GitHub being reachable.

**Filtering by title, in one place.** Lines whose pull request title starts with `chore(openspec)`
or is a version bump are dropped; everything else stays, with its type prefix kept, because
`fix:` and `docs:` are information. A release whose notes are empty after filtering shows the
version and date alone.

**Prereleases are shown, marked.** A reader on a preview wants to find it. The dist-tag rule
decides what "latest" is, and the page says "preview" beside those versions.

**The landing page's release line reads the repository's version, not the release list.** The
sync already writes `generated/site-meta.json` from `Directory.Build.props`, the one file the bump
script writes and the release workflow checks against the tag, so the hero line and the structured
data say the same thing and neither depends on GitHub answering. The changelog page is the one
place that reads the release list, because only it needs dates and notes. The README's badge
already reads GitHub.

## Risks / Trade-offs

- **A release with a sloppy pull request title shows a sloppy line.** → That is the incentive the
  page adds; the titles are public already.
- **The unauthenticated fetch fails on a developer's machine.** → The page is written with a note
  and the build passes; the deploy has the token.
- **The page is dated from the fetch, not from a source file.** → Its `lastmod` is the newest
  release date, which is the truth about the page.
