## 1. The top bar, first slice

- [ ] 1.1 Give the element the bar renderer wraps around every entry permission to shrink, so an
      entry that truncates itself can. Unit test: a bar narrower than its start entry truncates that
      entry instead of overflowing.
- [ ] 1.2 The brand reads the frame's narrow value: below it, draw the mark alone and carry the
      product's name as the entry's accessible name; above it, draw mark, name and tagline as today.
      Unit tests: both forms, and the accessible name in the compact one.
- [ ] 1.3 The language switcher reads the same value: below it, show the language's symbol without
      its name, keeping the switcher's accessible name and its list of languages. Unit tests: both
      forms.
- [ ] 1.4 Measure the demo's top bar at 390 pixels in English and German: brand, switcher and theme
      toggle all inside the viewport, nothing overlapping. Record the widths in this file.
- [ ] 1.5 Write the demo end-to-end test for the top bar at 390 pixels, to land with the adoption
      pull request: the theme toggle is within the viewport, the name is absent, the mark is present
      and the entry is announced by the product's name.
- [ ] 1.6 Show the demo on a phone-sized window and stop.

## 2. The folding bar, second slice

- [ ] 2.1 Rank the entries of a bar in fold order: end slot from highest order down, then centre,
      then start. Pure function, unit-tested with the demo's status bar as the example.
- [ ] 2.2 Observe the bar's width and each entry's natural width, remembering the last measured
      width of every entry by id, and decide which entries fit: entries return from the end of the
      rank until the next would not fit beside the fold control. Unit tests with stubbed widths:
      nothing folds when everything fits; the last entry folds first; a folded entry returns when the
      width allows; a narrowing and widening across one entry's threshold settles without a loop.
- [ ] 2.3 Draw the fold control at the end of the end group only while something is folded, with an
      icon and an accessible name, keyboard reachable, never itself folded, absent from the
      registry. Add its wording to the shipped translations.
- [ ] 2.4 Open a tray from the fold control that hosts the folded entries with the bar's own
      renderer, stacked vertically, positioned and dismissed the way the workbench's menus are.
      Unit tests: a declared button in the tray runs its command; a component entry renders in the
      tray; closing the tray returns focus to the control.
- [ ] 2.5 Check by hand, in the demo, the one component entry with a popover of its own, the look
      switch, opening from inside the tray.
- [ ] 2.6 Measure the demo's status bar at 390 pixels: no entry overlaps another, none is cut off,
      the folded entries are reachable through the control. Record what folded in this file.
- [ ] 2.7 Write the demo end-to-end test for the status bar at 390 pixels, to land with the adoption
      pull request: no two entries overlap, the legal link is reachable through the fold control and
      opens.
- [ ] 2.8 Run the accessibility checks over a bar with a fold control and an open tray.
- [ ] 2.9 Show the demo on a phone-sized window and stop.

## 3. Closing

- [ ] 3.1 Name the compact forms and the folding in the consumer documentation where the bar's
      slots are described, and in `llms-full.txt`.
- [ ] 3.2 Measure the weight the folding adds to the built shell package against the current build
      and name the figure in the pull request.
- [ ] 3.3 `openspec validate chrome-bars-on-a-narrow-viewport --strict` passes.
