> **Status:** approved

## Why

Two pieces the workbench draws for itself cannot be borrowed, and a product that wants them has to
draw them again. Both were found while building NextPA's distributions (F-010, F-011).

A settings row takes a label and a description and interpolates the label, so nothing can precede
it. Every neighbouring primitive takes a symbol — the rail entry, the bar item, the menu entry, the
navigation entry, the settings section itself — and the row is the exception. A product whose rows
are led by a symbol now keeps a copy of the row's markup with a symbol in front, which is the drift
a primitive exists to prevent.

The block that draws the product's identity is not part of the published surface, while its
neighbours in the same chrome are: the update badge and the version are both offered for a
distribution to place where it likes, and the version's own description names the about dialog as
such a place. A product that wants its identity to appear the same way in its own about dialog
copies the template instead.

## What Changes

- A settings row MAY be led by a symbol, resolved the way every other symbol in the workbench is. A
  row without one is drawn exactly as it is today.
- The block that presents the product's identity becomes part of the published surface, and a caller
  MAY pin the narrow form rather than following the frame it happens to sit in.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `ui-primitives`: adds that a settings row may carry a leading symbol.
- `product-identity`: adds that the product's identity can be presented where the product chooses,
  not only in the workbench's own frame.

## Impact

- `platform/libs/core/shell/src/lib/settings/lw-setting-row.ts` and its template.
- `platform/libs/core/shell/src/lib/regions/bar/shell-brand.ts` and its template, plus the package's
  public surface and `llms-full.txt`.
- NextPA's Studio drops its copy of the row and its copy of the identity block once it adopts the
  release. That is theirs to do.
