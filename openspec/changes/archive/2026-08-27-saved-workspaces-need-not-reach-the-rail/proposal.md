> **Status:** approved.

## Why

A workspace the user saves never appears in the rail by itself; the user puts it there, from
*Customize activity bar*, and that is the whole of what "pinning" is. What a product cannot do is
say no. The rail is the fixed anchor everything else is switched from, and a product that wants it
to hold its own sections and nothing else has no lever for that today.

Every other gesture the shell offers is already such a lever: closing a tab, splitting a pane, hiding
a view, tearing off a window and a dozen more are each a switch a distribution can turn off, exactly
so that a product can decide what its workbench is for. Placing a saved workspace in the rail is the
one that is missing.

It matters more now than it did. Once a saved workspace is a variant of a declared one it becomes
worth saving, and a product that encourages it will meet users who fill the rail with their own.
Today the only way to prevent that is to switch workspaces off entirely, which throws away the
feature to hide its side effect.

## What Changes

- The workspace feature a distribution composes gains a second switch: **whether the workbench lets
  saved workspaces be placed in the rail at all**.
- With it off, the curation dialog does not offer them, so the user cannot put one there. An entry a
  user placed before the switch was turned off disappears from the rail, and its placement is kept
  rather than erased, so turning the switch back on restores what they had.
- Everything else about a saved workspace still works: saving, renaming, resetting, switching, and
  the workspace dialog, which is where they are managed anyway.
- Workspaces the **product** declared are untouched either way: the product offers those with rail
  items of its own, and the workbench's report about a declared workspace nothing offers keeps
  firing exactly as it does today.
- Not in scope, and named so the switch is not later mistaken for it: whether a user may save
  workspaces at all. Nobody has asked for that, and a switch that quietly covered both would be
  impossible to name honestly.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspaces`: the requirement that workspaces are reachable in one gesture gains the product's say
  over whether the workbench offers saved ones that way, and states what remains true when it does
  not.

## Impact

- The workspace switches a distribution composes, and the rail entries the workbench registers for
  saved workspaces.
- The distribution guide, where the other switches are already listed.
- No change to what a plugin can do, and none to storage: a workspace that is not offered in the rail
  is stored exactly as one that is.
- No legacy source is dissolved by this change.
