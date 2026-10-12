> **Status:** approved.

## Why

NextPA reported on 2026-10-12 (finding F-051) that a choice between two or three options, all visible
at once and labelled with words, has to be written by hand: a label per option, a visually hidden
radio, and a drawn marker for the chosen one. The same markup now exists twice in NextPA.

The workbench offers a select, which hides the alternatives; radios in a list, which take a line
each; and a segmented group of icon buttons for toolbars, which toggles rather than chooses and has no
room for words. None of them is a labelled choice drawn as one control.

## What Changes

- The segmented class contract gains an option for words: a native radio inside a label, drawn as a
  segment of the group, the chosen one raised.
- Because the radios are native, a group of them is one tab stop, the arrow keys move the choice, and
  the group is named the way any group of radios is named. The workbench draws; it adds no script.
- An option may be unavailable but reachable, drawn as the unavailable choice controls are (see the
  change `an-unavailable-choice-stays-reachable`).
- `ui-primitives` gains a requirement for it; the brief and the design token reference describe it.

No API change beyond a new class name; ships as a patch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-primitives`: a choice among a few options can be drawn as one segmented control with words.

## Impact

- The shell's control class contracts, in both the Tailwind path and the pre-compiled stylesheet, and
  the frame kit's copy for isolated surfaces.
- `llms-full.txt`, "Weaver body primitives", and the design token reference.
- A testbed example in the Info view, with its strings, and an e2e test with an accessibility audit in
  both themes.
- NextPA finding F-051.
