> **Status:** approved — approved for implementation on 2026-09-06.

## Why

Open the demo on a phone. Measured at 390 pixels, the width of an ordinary phone, the top bar has
308 pixels between the two rails and its content needs 416 in English and 423 in German: the
product's mark and name take 188, the language switcher with flag and name 102 to 109, the theme
toggle with its three buttons 94. The theme toggle is therefore entirely off screen, and the name
does not shorten itself although it was meant to, because the element the workbench wraps each bar
entry in has no permission to shrink.

The status bar is worse. Its end group, in the demo the look switch, the preview badge, the version
and the legal link, is marked as not shrinking and is wider than the bar, so it slides left over the
start group: "Theme" is drawn on top of "Search", and the last entry is cut off at the edge. Entries
the user cannot read, and a link they cannot reach, in a workbench that promises to work on a phone.

The frame already adapts to a narrow viewport: side panels become an overlay and the launcher rail
stays. The bars were never given a rule for the same case, so each product discovers on its own
phone that its entries overlap, and answers it on its own.

## What Changes

- On a viewport the workbench already treats as narrow, the workbench's own top-bar entries take a
  **compact form**: the product's mark stands alone without its name, and the language switcher
  shows the language's symbol without its name. The threshold is the one the frame already uses for
  overlaying the side panels, tablet portrait included.
- A bar that cannot show every entry **folds the entries that do not fit into a menu at its end**,
  the least important first, so that every contributed entry stays reachable and no entry is ever
  drawn over another or cut off. Importance is the order an entry already declares.
- A bar entry the workbench cannot fold is never allowed to overlap its neighbour: an entry that
  may shorten itself, such as the product name, is given room to do so.

## Capabilities

### Modified Capabilities

- `shell-layout`: the requirement that the frame adapts to a narrow viewport gains what the
  workbench's own bar entries do there, and a new requirement states that a bar too narrow to show
  everything stays usable, mirroring the rule the content strip already carries.
- `product-identity`: the workbench presents the product's mark alone where there is no room for
  its name, so that the mark, not the name, is what identifies the product on a phone.

## Impact

- The bar renderer in the shell chrome, its brand entry and its language switcher. The theme toggle
  is untouched: with the compact forms it fits.
- The status bar of any product that contributes more than a phone can hold, which is every
  product with a version, a link and one control. The demo's status bar is the first consumer.
- No published type changes. A bar entry's `order` already exists and gains a second meaning: it
  is also what decides which entry folds first.

No legacy source is dissolved by this change.
