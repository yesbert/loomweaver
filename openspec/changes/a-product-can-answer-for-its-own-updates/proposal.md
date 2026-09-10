> **Status:** approved

## Why

Updating is the one part of the workbench with no seam under it (F-009). The service that decides
*what happened* also decides *how the user is told*, and there is nothing in between.

A check reports nothing to its caller: four outcomes are distinguishable inside the method and
indistinguishable outside it, so "no update", "could not check" and "an installation failed" collapse
into one silence. Each outcome shows a toast from inside the method, so a product drawing its own
answer gets its answer *and* the workbench's, saying the same thing twice in two places. The
automatic check is worse: a product cannot learn that one ran or what it found, so it can only let
the workbench's toast stand or have no announcement at all by shipping no offline machinery.

Everywhere else the workbench is built the other way. A bar item is replaced by registering the same
id, a gesture is switched off by a feature switch, a surface is declined by `omit`. Updates are the
one place with no handle.

## What Changes

- A check reports what it found, so a caller can draw it.
- The last check the workbench made is readable as state, automatic or manual, with the moment it
  happened, so a product can draw its own affordance instead of learning of a background check
  through a toast.
- A distribution MAY take the announcing over. Where it does, the workbench says nothing about
  updates and leaves both the drawing and the applying to the product, which already has the means to
  apply one.
- The default is untouched. A product that says nothing gets exactly the toasts it gets today.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `product-identity`: the requirements on noticing a new version and on checking quietly gain what a
  product may read and what it may take over.

## Impact

- `platform/libs/core/shell/src/lib/update/update.service.ts` — the outcome, the report and the guard
  around every notice.
- `platform/libs/core/shell/src/lib/provide-shell.ts` — where a distribution says it announces for
  itself.
- NextPA's Studio moves the check into its About dialog and marks its own status-bar version button.
  That is theirs to write once this is released.
