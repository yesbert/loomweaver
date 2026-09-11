> **Status:** proposed — not approved for implementation yet.

## Why

A picture of the workbench is made at whatever size and in whatever form the workbench chose, and the
caller gets no say in either. For the thing the capability exists for, attaching a picture to a fault
report, that is the wrong way round: the product knows what its tracker accepts and the workbench
does not.

Measured on the running testbed, a single picture of a 1440 × 860 window comes to **0.33 MB**,
because it is drawn at the screen's own pixel density and encoded losslessly. A product that wants a
thumbnail beside a form, or that answers to a tracker with an attachment limit, has to redraw the
picture itself afterwards — which means decoding, resizing and re-encoding what the workbench had
already drawn correctly a moment earlier.

The form matters more than the size. The same picture in a compressed format is a fraction of that,
and nothing a fault report is read for is lost with it. Neither can be asked for today.

## What Changes

- The caller may say **how large** the picture should be: at the screen's own density, at a plainer
  one, or within a width it names. Where what is asked for lies outside what can be drawn, the
  workbench draws the nearest thing it can rather than refusing, and the answer says what it did.
- The caller may say **in what form**: losslessly, as now and still the default, or compressed for
  carrying. Where the browser cannot produce the form asked for, the picture is still produced in one
  it can, and the answer says which. That case is real rather than theoretical, because at least one
  browser silently substitutes a format here.
- The answer describes the picture it carries rather than the screen it came from, so a caller that
  asked for something smaller can lay it out without measuring it again.
- Asking for nothing keeps exactly today's behaviour, so nothing a product already wrote changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workbench-capture`: gains what a caller may ask for about the picture's size and form, what
  happens to a request the workbench cannot meet exactly, and what the answer then says about itself.
  The capability states nothing about either today, which is the gap.

## Impact

- The published request a distribution makes, and the answer it gets back.
- The request the workbench already makes of each isolated surface carries a size; it gains the form
  as well, so that a surface draws once at the right size instead of being redrawn afterwards.
- **This change cannot be archived before `the-workbench-can-picture-itself` is**, because the
  capability it modifies is created by that one. It can be worked on beforehand; it cannot land in
  the specs first.
- No legacy source is dissolved by this change.

## Non-Goals

- **Saving, uploading or attaching.** Where a picture goes is the product's own business and stays
  there. Once it can be asked for at the right size and in the right form, saving it is writing bytes
  that already exist.
- **A second representation of the same picture.** A caller needing bytes rather than an address
  converts what it was given; offering both would be two doors onto one thing, and the memory cost is
  paid twice for everyone to spare one line from some.
- **Redrawing a picture already taken.** The size is chosen when it is drawn, not afterwards.
