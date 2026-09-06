## 1. The top bar, first slice

- [x] 1.1 Give the element the bar renderer wraps around every entry permission to shrink, so an
      entry that truncates itself can. Unit test: a bar narrower than its start entry truncates that
      entry instead of overflowing.
- [x] 1.2 The brand reads the frame's narrow value: below it, draw the mark alone and carry the
      product's name as the entry's accessible name; above it, draw mark, name and tagline as today.
      Unit tests: both forms, and the accessible name in the compact one.
- [x] 1.3 The language switcher reads the same value: below it, show the language's symbol without
      its name, keeping the switcher's accessible name and its list of languages. Unit tests: both
      forms.
- [x] 1.4 Measure the demo's top bar at 390 pixels in English and German: brand, switcher and theme
      toggle all inside the viewport, nothing overlapping. Record the widths in this file.
      Measured 2026-09-06, iPhone 13 viewport, local shell build over the demo: the bar has 308
      pixels between the rails; the mark takes 28, the switcher 50, the theme toggle 94, and the
      last button ends at 338 of 390, in English and in German alike. Before: 416 and 423 in a
      308-pixel bar. The mark's alternative text is the product name, the switcher's accessible
      name is "Language: English". The unit test for 1.1 pins the shrink permission on the host,
      since the test runner lays nothing out; the truncation itself is measured here.
- [x] 1.5 Write the demo end-to-end test for the top bar at 390 pixels, to land with the adoption
      pull request: the theme toggle is within the viewport, the name is absent, the mark is present
      and the entry is announced by the product's name. Written, waiting outside the repository
      until the adoption pull request, so the nightly does not run it against the published
      package.
- [x] 1.6 Show the demo on a phone-sized window and stop. Accepted by the owner on 2026-09-06.

## 2. The folding bar, second slice

- [x] 2.1 Rank the entries of a bar in fold order: end slot from highest order down, then centre,
      then start. Pure function, unit-tested with the demo's status bar as the example.
- [x] 2.2 Observe the bar's width and each entry's natural width, remembering the last measured
      width of every entry by id, and decide which entries fit: entries return from the end of the
      rank until the next would not fit beside the fold control. Unit tests with stubbed widths:
      nothing folds when everything fits; the last entry folds first; a folded entry returns when the
      width allows; a narrowing and widening across one entry's threshold settles without a loop.
      Two things the demo taught: an entry squeezed by the bar reports its squeezed width, so the natural width is read as the larger of its box and its scroll width; and the entries' own sizes change after the bar's, as translations arrive, so every entry host is observed alongside the bar. A bar with no width, one not laid out, folds nothing.
- [x] 2.3 Draw the fold control at the end of the end group only while something is folded, with an
      icon and an accessible name, keyboard reachable, never itself folded, absent from the
      registry. Add its wording to the shipped translations.
- [x] 2.4 Open a tray from the fold control that hosts the folded entries with the bar's own
      renderer, stacked vertically, positioned and dismissed the way the workbench's menus are.
      Unit tests: a declared button in the tray runs its command; a component entry renders in the
      tray; closing the tray returns focus to the control.
      The tray also closes on Escape from anywhere and on a pointer outside it, and an inner popover that takes Escape first, the look switch's list, is left to close on its own.
- [x] 2.5 Check by hand, in the demo, the one component entry with a popover of its own, the look
      switch, opening from inside the tray.
      Checked at 250 pixels with the look switch folded: its list opens inside the viewport from within the tray, Escape closes the list and leaves the tray, a second Escape closes the tray and returns focus to the control.
- [x] 2.6 Measure the demo's status bar at 390 pixels: no entry overlaps another, none is cut off,
      the folded entries are reachable through the control. Record what folded in this file.
      Measured 2026-09-06, iPhone 13 viewport, local shell build over the demo. In the bar: search 8 to 107, look 116 to 242, update 250 to 278, preview 286 to 346, the fold control 354 to 382 of 390. Folded: the version and the legal link, in that order of return. No overlaps, nothing cut off; at 320 pixels update and preview fold too, at 1280 everything is back and the control is gone.
- [x] 2.7 Write the demo end-to-end test for the status bar at 390 pixels, to land with the adoption
      pull request: no two entries overlap, the legal link is reachable through the fold control and
      opens.
      Written, waiting outside the repository beside the top-bar test until the adoption pull request.
- [x] 2.8 Run the accessibility checks over a bar with a fold control and an open tray.
      Axe, WCAG 2.1 AA tags, on the demo at 390 pixels with the tray open and again closed: no violations.
- [ ] 2.9 Show the demo on a phone-sized window and stop.

## 3. Closing

- [x] 3.1 Name the compact forms and the folding in the consumer documentation where the bar's
      slots are described, and in `llms-full.txt`.
- [x] 3.2 Measure the weight the folding adds to the built shell package against the current build
      and name the figure in the pull request.
      Unminified ES module of the shell: 1,011,621 bytes published as 0.9.0-preview.7, 1,022,078 bytes with this change, about 10 KB more.
- [ ] 3.3 `openspec validate chrome-bars-on-a-narrow-viewport --strict` passes.
