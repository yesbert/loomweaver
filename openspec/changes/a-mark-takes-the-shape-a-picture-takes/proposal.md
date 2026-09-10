> **Status:** approved

## Why

A rail entry, a bar button and a menu heading each take a picture, a short mark and an icon, and the
workbench falls back picture → mark → icon. The picture is drawn round and cropped; the mark is drawn
as bare letters on the button's own background. Two alternatives for the same slot, standing for the
same thing, and only one of them looks like it stands for anything (F-011 in NextPA's log, F-008).

The menu heading already does it right: its slot is round and filled and the picture fills the slot.
The rail entry and the bar button do not, so an account with a picture is an avatar and an account
with initials is two letters adrift in a row of framed controls.

## What Changes

- Where the workbench draws a short mark in place of a picture, the mark takes the shape a picture
  takes in that slot: round, filled, of the same size.
- The plain form stays available for a list, where a filled circle would be heavy: the change is to
  the chrome slot, not to how letters are set.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `shell-layout`: the requirement that lets a chrome entry be drawn as a picture now says what the
  mark standing in for one looks like.

## Impact

- `platform/libs/core/shell/src/lib/styles/theme.css` — a slot class beside the picture's.
- `platform/libs/core/shell/src/lib/regions/rail/shell-rail.html` and
  `platform/libs/core/shell/src/lib/regions/bar/shell-bar-item.html`.
- Visible in every distribution whose account entry carries initials rather than a photograph.
