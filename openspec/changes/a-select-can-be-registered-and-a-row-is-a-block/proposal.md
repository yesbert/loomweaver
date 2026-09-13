> **Status:** approved.

## Why

Two of the workbench's own building blocks fail a consumer silently, and both were found by a product
building on 0.9.6.

The brief lists the select among the elements a plugin body uses by tag. Every other element on that
list can be registered by the consumer itself, so a body using it renders outside a running workbench,
which is how a body is unit tested. The select cannot. Its registration exists and the workbench calls
it on start, but it is not published. An element that was never registered is not an error: it stays
in the page as an unknown tag and draws nothing. A test of a dialog offering a choice therefore cannot
tell a working control from a missing one.

The settings row lays itself out correctly inside, but the row itself is an inline box. Anything a
container paints on the row's own edge, which is how a stack of rows is separated, is not drawn. The
workbench's own settings surface separates its rows exactly that way, so it is affected too, and a
product that wanted the separator stopped using the row.

## What Changes

- Every element the workbench offers by tag can be registered by the consumer from the published
  surface, the select and its option included. A check keeps that true for elements added later.
- A settings row takes a line of its own, so a container can separate, frame or space rows by their
  edges. The workbench's settings surface draws its separators again.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-primitives`: the requirement *The workbench's controls are usable from any technology* gains
  the guarantee that each element can be registered by whoever renders it, not only by a running
  workbench. A new requirement states that a settings row occupies a line of its own.

## Impact

- The shell package publishes one more registration function. Nothing is removed or renamed.
- A consumer that drew its own separators around rows because the container's did not show may now
  see both. The row gains no border of its own, so this only happens where a consumer added one to
  work around the fault.
- NextPA findings F-012 and F-013.
- No legacy source is dissolved by this change.

## Non-Goals

- **A compact settings row.** The finding suggests one for surfaces that list values rather than
  controls. Nobody is waiting on it, and it is a design question of its own.
- **Registering elements through anything other than the functions that exist.** A single
  "register everything" entry point would be convenient, and it is not what was asked for.
