> **Status:** approved.

## Why

A workspace the user saves is a variant of the workspace it was saved from, and the rail marks
where the user is only when an entry carries that exact workspace. A variant the user has not
placed in the rail, or that the product does not offer there, therefore leaves the rail blank
while it is active: the user chose "Sales, month end" in the dialog and the rail shows Sales as
just another entry, as though they were somewhere else entirely. The rail is the fixed anchor
everything is switched from, and an anchor that goes blank for the workspaces a user made
themselves is not one.

That blank was accepted when a product first got the say over whether saved workspaces reach the
rail at all, on the argument that inventing an entry would reintroduce what the product had turned
off. Marking the origin invents nothing: the entry is the product's own, and the variant belongs to
it by the record the workbench already keeps and already shows in the dialog.

## What Changes

- A rail entry that carries a declared workspace is marked as current not only while that
  workspace is active, but also while a **variant of it** is active whose own entry is drawn in no
  rail. That is the case for a variant the user never placed, and for every variant while the
  product has decided that saved workspaces are not offered in the rail.
- Where the variant's own entry **is** drawn, in whichever rail, that entry alone is marked, as
  today. Two entries are never marked at once.
- A variant without an origin still marks nothing, because no entry is its own.
- The entry's icon, name and tooltip are unchanged: the marking says where the user is, not which
  variant they are in. Saying so is a separate question with its own answer later, if wanted.
- The switch a product sets over saved workspaces in the rail, and the user's ability to place one,
  are untouched.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspaces`: the requirement that workspaces are reachable in one gesture and identifiable at a
  glance states which entry is marked while a saved workspace is active, and reverses what it
  said about a saved workspace the product does not offer: the origin's entry is marked rather
  than nothing.

## Impact

- The rail's notion of the current entry, in the shell.
- The distribution guide's section on putting a workspace in the rail, and the passage on saved
  workspaces the product keeps out of it.
- The demo's workspace suite, which gains the assertion that saving from Sales keeps Sales marked.
- No change to the published contract, to storage or to what a plugin can do.
- No legacy source is dissolved by this change. It reverses one decision recorded in the archived
  change `2026-08-27-saved-workspaces-need-not-reach-the-rail` (design note, "A saved workspace
  may be active with nothing marked in the rail"), which stays where it is as history.
