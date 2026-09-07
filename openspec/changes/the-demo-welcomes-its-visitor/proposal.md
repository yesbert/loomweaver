> **Status:** approved.

## Why

The first outside visitor of the live demo said what every visitor will think: it shows everything
at once and does not say what it is. The change that links the demo to the docs will answer that
properly, and it starts with a discussion, so it takes a while. Until then the demo should say so
itself, once, at the door: what this is, what it is not yet, and where to go today.

The demo also has no place that says what it is at all. The status bar shows a version number and
a "preview" badge, and neither opens anything. A product has an About; the demo should too, and the
welcome is the same content shown a first time by itself.

## What Changes

- **A welcome dialog on the first visit**, with the demo's logo, a heading that welcomes, three
  short paragraphs (this is a sample product showing every feature; we are working on pointing each
  part at the docs and the code; if you want to build today, start with the documentation), the
  platform version, a link that opens the documentation in a new tab, and a "Got it" button. It
  shows once per browser and is remembered as seen.
- **An About entry in the status bar** that replaces the shell's version entry: an info icon with the
  version as its label, opening the same dialog. The "preview" badge stays as it is and goes away by
  itself with the first release that is not a preview.
- **An About section in the settings** with the same content, so the dialog is reachable from the
  place people look for a version.
- **The suite marks the visitor as welcomed** once, centrally, so no existing test meets the dialog;
  one test covers the dialog itself.
- Both languages the demo speaks.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is the demo's own decoration on what the platform already offers: a bar item, a command,
a settings section, a dialog the plugin opens, and leaving out a default bar entry. The version
shown is the platform's, which is right for a demo of the platform and would not be for a product;
an About the platform offers to products is a different change under product identity, not opened
here.

## Impact

- The demo: a new in-page plugin carrying the command, the dialog, the settings section and the
  first-visit rule; the status bar composition in the demo's app config; the demo's translations;
  the demo's end-to-end configuration and one new test.
- No legacy source is dissolved by this change.
