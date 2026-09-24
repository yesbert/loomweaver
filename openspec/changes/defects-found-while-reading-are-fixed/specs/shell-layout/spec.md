## MODIFIED Requirements

### Requirement: A panel can be collapsed and resized, and remembers both

The user SHALL be able to collapse a panel and expand it again, and to change its width by dragging
or from the keyboard. Both SHALL survive a restart, the width SHALL be constrained to that panel's
usable range, and an unreadable stored value SHALL be ignored rather than propagated.

Every width the user releases SHALL be remembered as chosen, including a width equal to the panel's
default, so that the choice is kept if the panel's default later changes.

A collapsed panel on a side that has no launcher rail SHALL leave its column entirely, so the
content reaches the edge, and SHALL offer a way back.

#### Scenario: Width changes persist, and mid-drag changes do not

- **WHEN** the user drags a panel's edge
- **THEN** the width follows the pointer
- **AND** only the released width is remembered

#### Scenario: The width can be changed from the keyboard

- **WHEN** the panel's edge has focus
- **THEN** arrow keys change the width, a modifier makes the step coarser, and the extremes are
  directly reachable

#### Scenario: An unusable stored width does not strand the panel

- **WHEN** the stored width is unreadable or outside the panel's usable range
- **THEN** it is ignored or brought back into range

#### Scenario: A chosen width equal to the default outlasts a changed default

- **WHEN** the user releases a panel at exactly its default width
- **AND** the distribution later declares a different default for that panel
- **THEN** the panel opens at the width the user released

#### Scenario: A collapsed rail-less panel gives the space back

- **WHEN** a panel on a side without a launcher rail is collapsed
- **THEN** its column disappears and the content area extends into it
- **AND** a control to expand it again remains reachable

#### Scenario: A drag whose edge disappears still ends

- **WHEN** the user is dragging a panel's edge and the edge goes away before the pointer is
  released, because the panel collapses or the window becomes too narrow for panels beside the
  content
- **THEN** the drag ends with the width reached so far, and that width is remembered as if released
- **AND** panels collapse and expand afterwards exactly as they did before the drag

### Requirement: The user curates what lives in each rail and sidebar

An item in a launcher rail and a view in a sidebar SHALL live in exactly one of them at a time, and
the user SHALL be able to move it to the other, reorder it among its neighbours, and hide it.
Every one of those SHALL be possible by pointer and from the keyboard, and each SHALL survive a
restart.

A checklist SHALL say which entries live here, including entries that currently live nowhere, so
that a hidden entry can be brought back.

#### Scenario: Moving a view to the other sidebar takes it out of the first

- **WHEN** the user moves a view to the opposite sidebar
- **THEN** it appears there and is gone from the one it came from

#### Scenario: A moved entry is not put back by the workbench

- **WHEN** the application restarts after a view was moved
- **THEN** it is still where the user put it, not where it was declared

#### Scenario: An entry that lives nowhere can be brought back

- **WHEN** a view has been hidden or dragged into the content area
- **THEN** the checklist still offers it, and choosing it places it in the sidebar whose checklist
  was used

#### Scenario: Re-showing an entry on its own side restores its neighbourhood

- **WHEN** a hidden view is shown again on the side it was declared for
- **THEN** it returns among its declared neighbours rather than at the end

#### Scenario: Reordering is possible without a pointer

- **WHEN** an entry has keyboard focus
- **THEN** it can be moved within its band and to the other side from the keyboard, and the result
  is announced

#### Scenario: A launcher entry that only opens a menu is curated like any other

- **WHEN** a launcher entry names a menu slot and an opening gesture but no action of its own
- **THEN** the checklist lists it, and the user can hide it or move it to the other rail from there
- **AND** once it is hidden, the checklist still offers it and choosing it brings it back
