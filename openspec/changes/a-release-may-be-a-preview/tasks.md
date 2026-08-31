## 1. The workbench answers whether it is a preview

- [ ] 1.1 Expose, alongside the version the workbench already reports, whether that version is a
      preview of an unreleased line, derived from the stamped version and nothing else.
- [ ] 1.2 Unit-test both answers and the boundary: a plain version, a preview of a line, and a
      version whose marker is malformed, which must not be reported as a preview by accident.
- [ ] 1.3 Document it on the published contract, including that announcing a preview is the
      distribution's and that the workbench marks nothing of its own.
- [ ] 1.4 Test that the workbench adds no marking on its own while a preview runs.

## 2. A preview reaches only whoever asks for it

- [ ] 2.1 Derive the distribution tag from the version in the release workflow: a version carrying a
      prerelease marker goes to the preview tag, anything else to the default one.
- [ ] 2.2 Verify on a real run that a preview does not become what a plain install resolves to, and
      that the released line is still what a plain install resolves to afterwards.

## 3. The version tool can count a preview

- [ ] 3.1 Teach the tool to start a preview series for the next line.
- [ ] 3.2 Teach it to advance the current series.
- [ ] 3.3 Keep every existing operation behaving exactly as before, and keep the tool the only place
      a version is invented.
- [ ] 3.4 Check the tool's output against what the release guard compares, so a preview tag and its
      stamped version cannot drift.

## 4. The demo shows it

- [ ] 4.1 Add a bar item of the demo's own, ahead of the version, shown only while the running
      version is a preview.
- [ ] 4.2 Translate it in both languages the demo speaks.
- [ ] 4.3 Point the demo at whichever published line is worth showing, and record in its README
      which line it consumes and that the sentence about being an honest test still holds because a
      preview is installable too.

## 5. Write down how releases work now

- [ ] 5.1 Replace the rule that releases are always patch versions with what this change puts in its
      place, including that a breaking change below 1.0 belongs in a new line rather than a patch.
- [ ] 5.2 Record the accepted cost: while the next line is in preview, a fix to the released line
      would be branched from that line's tag, and nothing is built for it.

## 6. The self-report says it too

- [ ] 6.1 Add the running version, and whether it is a preview, to what the workbench reports about
      its own composition, so a developer asking what they are running is told without looking
      elsewhere.
- [ ] 6.2 Test that a released build reports its version without claiming to be a preview.

## 7. Close the loop

- [ ] 7.1 Run the platform and demo tests and lint.
- [ ] 7.2 Publish a preview end to end, install it in the demo, and confirm the badge appears and
      that a plain install is unaffected.
- [ ] 7.3 Confirm the demo returns to the released line by itself once that line is published, with
      no edit to its range.
