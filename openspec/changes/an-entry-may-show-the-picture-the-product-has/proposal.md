> **Status:** approved.

## Why

A launcher entry standing for a person or a project draws an icon, or one or two letters where a
fixed glyph would make every such entry look alike. Where the product actually has a picture of what
the entry stands for, neither is what a user recognises: they know the face, not the initials.

The workbench cannot be worked around here, because it draws the control. A product can neither put a
picture into it nor, more importantly, decide what happens when that picture does not arrive — which
is the normal case, not the exception: a person has no photo, a link has expired, the network is
gone.

## What Changes

- A launcher entry, and the heading of a menu opened from one, MAY carry a picture of what it stands
  for.
- The picture is the first choice of three, not a replacement for them: where there is no picture, or
  where the one given does not load, the entry falls back to the short mark it would have drawn, and
  to its icon where it has no mark. The fallback is the workbench's, so a product that provides a
  picture does not have to provide a broken one.
- The picture is decoration: the entry is still announced by its title, and the menu by what its
  heading names, so nothing is read twice.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shell-layout`: a launcher entry may be drawn as a picture of what it stands for, falling back to
  the mark and then the icon it already declares.
- `menus`: the heading of a menu opened from a control may carry the same picture, under the same
  fallback.

## Impact

- **Published contract:** the launcher entry and the menu heading gain an optional picture. Additive;
  an entry without one is drawn exactly as it is today.
- **Shell:** the rail and the menu heading draw it, and both notice a picture that fails to load.
- **Documentation:** `llms-full.txt`, the weaver guide and the JSDoc on both shapes. A product
  serving pictures from another origin has to allow that origin itself, which the guide says.
- **Legacy sources dissolved:** none.
