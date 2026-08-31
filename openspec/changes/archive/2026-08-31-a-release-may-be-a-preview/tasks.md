## 1. The workbench answers whether it is a preview

- [x] 1.1 Expose, alongside the version the workbench already reports, whether that version is a
      preview of an unreleased line, derived from the stamped version and nothing else.
- [x] 1.2 Unit-test both answers and the boundary: a plain version, a preview of a line, and a
      version whose marker is malformed, which must not be reported as a preview by accident.
- [x] 1.3 Document it on the published contract, including that announcing a preview is the
      distribution's and that the workbench marks nothing of its own.
- [x] 1.4 Test that the workbench adds no marking on its own while a preview runs.

## 2. A preview reaches only whoever asks for it

- [x] 2.1 Derive the distribution tag from the version in the release workflow: a version carrying a
      prerelease marker goes to the preview tag, anything else to the default one.
- [x] 2.2 Verified without a release, because no series was open to justify one. The workflow's own
      rule was run against the versions the tool produces: a preview resolves to the preview tag and
      a released version to the default one. The ranges that carry the rest were checked against
      semver directly: a consumer on `^0.7.9` receives neither `0.8.0-preview.1` nor `0.8.0`, and
      still receives `0.7.10`. What a real run would add is that npm behaves as documented.

## 3. The version tool can count a preview

- [x] 3.1 Teach the tool to start a preview series for the next line.
- [x] 3.2 Teach it to advance the current series.
- [x] 3.3 Keep every existing operation behaving exactly as before, and keep the tool the only place
      a version is invented.
- [x] 3.4 Check the tool's output against what the release guard compares, so a preview tag and its
      stamped version cannot drift.

## 4. The demo shows it

Implemented and verified, and waiting to land: the demo builds against the published packages, and
what it now reads does not exist in the released line. It merges with the first release that carries
it.


- [x] 4.1 Add a bar item of the demo's own, ahead of the version, shown only while the running
      version is a preview.
- [x] 4.2 Translate it in both languages the demo speaks.
- [x] 4.3 Point the demo at whichever published line is worth showing, and record in its README
      which line it consumes and that the sentence about being an honest test still holds because a
      preview is installable too.

## 5. Write down how releases work now

- [x] 5.1 Replace the rule that releases are always patch versions with what this change puts in its
      place, including that a breaking change below 1.0 belongs in a new line rather than a patch.
- [x] 5.2 Record the accepted cost: while the next line is in preview, a fix to the released line
      would be branched from that line's tag, and nothing is built for it.

## 6. The self-report says it too

- [x] 6.1 Add the running version, and whether it is a preview, to what the workbench reports about
      its own composition, so a developer asking what they are running is told without looking
      elsewhere.
- [x] 6.2 Test that a released build reports its version without claiming to be a preview.

## 7. Close the loop

- [x] 7.1 Run the platform and demo tests and lint.
- [x] 7.2 Verified as far as it goes without publishing, which was the owner's call: opening a
      preview series only to exercise the machinery would leave the released line without a home for
      fixes and no unfinished work to show. What was checked instead: the packed artifacts carry the
      new member, which is what a consumer actually installs; the badge appears and disappears with
      the fact, seen by stamping a preview version locally; and the tag rule sends a preview nowhere
      near a plain install. The first real series is the end-to-end proof, and it costs nothing to
      wait for it.
- [x] 7.3 Confirmed against semver rather than by waiting: `^0.8.0-preview.1` covers later previews
      of that line **and** the version that ends it, and does not reach beyond the line.
