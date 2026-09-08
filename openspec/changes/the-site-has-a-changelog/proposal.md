> **Status:** approved — approved for implementation on 2026-09-08.

## Why

The site has no changelog, and the project has twelve releases with notes on GitHub that nobody
finds from the site. A reader who wants to know whether the project is alive, what changed last
week, or whether the version they installed has the fix they read about, has to leave for GitHub
and read a release list written for maintainers. Every comparable documentation site carries a
changelog in its header, and its absence reads as a project that does not ship.

The release notes exist and are readable: they are generated from the pull requests merged since
the previous tag, and this repository's pull request titles are sentences. What is missing is the
page.

## What Changes

- **A changelog page on the site**, one entry per release, newest first, with the version, the
  date and the notes, generated at site build from the GitHub release list. Prereleases are marked
  as such. Entries that are housekeeping (version bumps, change archiving) are filtered out, so the
  page reads as what changed for a consumer.
- **A Changelog entry in the header**, beside Docs and Get started.
- **The hero's release line** on the landing page reads the latest release from the same data, so
  it cannot go stale.
- **A link from the README's release badge row** stays as it is; the page is linked from the docs
  overview.
- No `CHANGELOG.md` in the repository: the release workflow states the reason, the notes are a
  view of what the pull requests already say and a second list would have to be kept true.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The site and its navigation; no platform behaviour. The change declares `skip_specs`.

## Impact

- `website/`: a page, a build-time fetch of the release list, the header entry, the landing page's
  release line.
- `.github/workflows/deploy.yml`: the site build gets the repository token in its environment so
  the release list is fetched without rate limits.
- `docs/README.md`: one link.
- No legacy source is dissolved by this change.
