## 1. A second domain plugin

- [x] 1.1 An `insights` plugin with its own manifest, capability grant and translation namespace in
  both shipped languages, composed beside `quotes`.
- [x] 1.2 A pipeline surface: the quotes by status, and the value of what is out.
- [x] 1.3 A deadlines surface: the quotes whose validity runs out next, soonest first.
- [x] 1.4 A margin surface over the accepted quotes, gated to the accounting role like the margin in
  the document.

## 2. The workspace

- [x] 2.1 A dashboard workspace arranging the three in two levels with declared proportions — the
  pipeline beside a column holding deadlines above margin.
- [x] 2.2 Its rail entry, under an icon of its own, registered with the declaration rather than after
  it.
- [x] 2.3 The dashboard is the workspace a first visit starts in; quotes keeps its entry and loses
  the flag.

## 3. Pin what a reader is promised

- [x] 3.1 An end-to-end case: a first visit opens the dashboard with all three areas and the declared
  proportions.
- [x] 3.2 An end-to-end case: the sales account meets the dashboard without the margin area, the
  other two unmoved.
- [x] 3.3 An end-to-end case: the quotes workspace is still reachable from the rail and still opens
  its quote.
- [x] 3.4 The console stays free of workspace messages — the new declaration must not be the first to
  trip the guard.

## 4. Verify

- [x] 4.1 Build, unit tests and the end-to-end suite pass against the published packages.
