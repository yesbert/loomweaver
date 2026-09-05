## 1. The overflow, on its own

- [x] 1.1 Split the rail into a scrolling top band and a static bottom band, keeping the drag list
      whole and registering the scroll box as a scrolling container for the drag layer.
- [x] 1.2 Bring a focused entry into view when the keyboard reaches one that is scrolled out.
- [x] 1.3 Unit tests: a rail longer than its height scrolls and reaches its last entry; the anchored
      band stays in view; a rail that fits renders as before.
- [x] 1.4 Exercise reordering, the move between rails and the keyboard chord in a scrolled rail with
      both bands populated, and fix what the scroll boundary breaks.

## 2. The stored choice

- [x] 2.1 Hold one entry per rail id under a single settings key, hydrated on start and announced
      across tabs the way the rail's curation state already is.
- [x] 2.2 Unit tests: the choice for one rail leaves the other alone; an unknown or malformed stored
      value falls back to off; the choice survives a reload.

## 3. The settings rows

- [x] 3.1 Register one switch per declared rail directly after the text size, each naming its side,
      and none where the frame declares no rail.
- [x] 3.2 Add the row wording to the shipped translations, reusing the side names the rail already
      carries for itself.
- [x] 3.3 Unit tests: a frame with two rails offers two rows and a frame with one offers one; a
      frame with none offers none; toggling a row changes only its own rail.

## 4. The labelled rail

- [x] 4.1 Draw the entry's name under its icon when the rail's choice is on: the rail widens, the
      name wraps to at most two lines and scales with the text size setting.
- [x] 4.2 Drop the tooltip for an entry whose name is fully readable, and keep it for one whose name
      is shortened, deciding by measuring the entry's own box rather than the string.
- [x] 4.3 Keep the labelled form working for the entries that are not a plain icon: a picture, and
      initials.
- [x] 4.4 Unit tests: names appear only for the rail whose choice is on, and a readable name has no
      tooltip. Which names count as shortened is pinned on the measurement itself; that a shortened
      name keeps its tooltip is pinned end-to-end, because the render hook that drives it does not
      run under a component fixture.

## 5. Proving it in a distribution

- [x] 5.1 Give the testbed an end-to-end path with a labelled rail and enough entries to scroll,
      covering both sides.
- [x] 5.2 Run the accessibility checks over the labelled and the scrolled rail.
- [x] 5.3 Confirm the demo is untouched with the switch off, and record in the change what the
      labelled rail looks like at the sizes the testbed produced. Checked by putting the locally
      built package under the demo: the rail stays 40 pixels wide with seven entries, seven
      tooltips and no names, and the settings gain exactly one switch, the demo declaring one rail.

## 6. How a rail is named

- [x] 6.1 Ship a third name, for a left rail standing beside a right one, in both languages.
- [x] 6.2 Pick the name from how many rails the frame declares, and use the one name both for the
      announced region and for the settings row.
- [x] 6.3 Move the testbed's rewording to a neighbouring key, so the testbed shows the workbench's
      own word for the rail and still proves that one string can be replaced.
- [x] 6.4 Carry the new name through every end-to-end helper and test that addresses the rail by it.
- [x] 6.5 Unit tests: two rails are named for their sides and a lone rail is not; the settings row
      and the announced region carry the same name.
