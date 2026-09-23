> **Status:** approved.

## Why

A product cannot leave a part of a container out. A container declares its children once, and the
only way to keep one from a person is an access requirement on the child, which by design keeps the
child's place and shows a padlock explaining why. That is right for an access gate. It is not what a
product means when it decides that a part does not belong in this person's strip at all, and that
decision is not always a role: it may follow a setting, a licence or the product's own state, and it
may change while the container is open. NextPA raised it as finding F-039 for the assistant's
"Erweitert" part, which V1 showed to developers only; today everyone without the role sees a padlock
there. The owner decided on 2026-09-23 that the product controls this, not a role, that it is a
general capability, that it covers the children of a container first, and that it comes apart from
marking a tab.

## What Changes

- **A plugin may leave a child of a container out, and bring it back**, live: `ctx.setChildShown(
  childSurfaceId, shown)`. A child left out is absent from every container that lists it: from the
  inner tab strip, from walking the strip with the keyboard, from the inner pane pickers, and from
  closing in bulk. It is not a placeholder.
- **A child left out keeps its place.** The arrangement is not changed; the child is only not drawn.
  Brought back, it stands where it stood, and what the person did with the other children is kept.
- **The focus and the address move to a child that is shown.** A focused child that is left out hands
  the focus to a shown neighbour, and the address follows. An address naming a child that is left out
  opens the container on its first shown child instead.
- **A pane holding only children that are left out is not drawn**; the panes beside it take the room,
  and it returns with its child.
- Leaving out wins over the access placeholder: a child left out is not drawn whether or not the
  session qualifies for it.

New: `PluginContext.setChildShown`. Nothing existing changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `containers`: a new requirement, *A product may leave a child out, and bring it back*; *A child may
  carry an address of its own* states what an address naming a child left out reaches.

## Impact

- `platform/libs/core/plugin-sdk`: `PluginContext.setChildShown`, with JSDoc.
- `platform/libs/core/shell`: a registry of children left out, the host plugin context and the
  sandbox RPC, and in `regions/pane/container/` and `regions/pane/`: the drawn tree, the strip, the
  pane body's active tab, the pickers, closing in bulk, and the container's focus and address.
- `llms-full.txt`, `docs/weaver/containers.md`.
- NextPA finding **F-039**, second half. NextPA can drop the `access` on the "Erweitert" part and leave
  it out for a person without the Developer role.
