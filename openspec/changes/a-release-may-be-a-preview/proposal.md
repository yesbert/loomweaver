> **Status:** proposed — not approved for implementation yet.

## Why

Every release goes to the one place every consumer installs from, so there is nowhere to put work
that is not finished. A series of breaking changes has to land all at once or not at all, and there
is no way to show it to anyone before it is done.

The demo makes that concrete. It consumes the published packages, exactly as a consumer would, and
the deployed one is built from the registry — so anything unpublished cannot be shown on it at all.
Work in progress is invisible until it stops being work in progress.

The current policy compounds this. Releases are patch versions even when they break, which throws
away the protection a caret range gives for free below 1.0: a consumer pinned to `^0.7.x` would not
receive a `0.8.0` at all, but does receive a breaking `0.7.9`.

## What Changes

- A release may be a preview: a version carrying a prerelease marker is published under a separate
  distribution tag, so it is installable by anyone who asks for it and reaches nobody who does not.
- Which tag a release goes to is derived from the version itself rather than chosen separately, so
  the two cannot disagree.
- The version tool learns to start a preview series and to advance one.
- The demo may point at whichever published line is worth showing, and returns to the stable line by
  itself once the series lands, because a range over a preview also covers the final version.
- **The workbench says whether the version it is running is a preview**, as part of what it already
  exposes about its version, so a product does not have to take a version apart to find out. How
  loudly that is announced stays the product's decision, which is where showing the version already
  sits.
- The demo shows it, and is the worked example of a product doing so.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-identity`: the requirement *The running version is visible* extends to what is exposed
  saying whether the running version is a preview, and states that the workbench does not decide how
  prominently a product announces it.

## Impact

- `.github/workflows/release.yml` — publishes to a derived distribution tag rather than always the
  default one.
- `scripts/bump-version.sh` — understands prerelease versions; today it parses three numbers and
  offers only major, minor and patch.
- `@loomweaver/shell` — what the version service exposes, and the JSDoc on it.
- `demo/package.json` and the demo's status bar — the worked example.
- `demo/README.md` — the sentence calling the demo the honest test stays true, and gains which line
  it currently consumes.
- `.claude/docs/reference/releasing.md` — the rule that releases are always patch versions is
  replaced by this one, and the maintenance question below is recorded there.

**A cost this change accepts rather than solves.** While the repository's version is a preview of the
next line, there is no branch for a fix to the stable one; it would have to be branched from that
line's tag. Nothing is built for it here, because it has not happened yet.

No legacy source is dissolved by this change.
