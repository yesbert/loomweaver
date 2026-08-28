# shell-layout Specification

## Purpose
The workbench has a frame — bars, launcher rails, side panels and a content area — and a
distribution declares which of those it wants and where. The frame is the one part of the interface
the workbench draws itself; everything inside it arrives as a contribution.

## Requirements

### Requirement: A distribution declares its frame; the workbench renders it

A distribution SHALL declare its regions, each with an identity, a kind and a docking position, and
the workbench SHALL render exactly those. A region that is not declared SHALL not exist, and a
contribution aimed at it SHALL be reported rather than silently discarded.

The workbench SHALL supply a default frame, so that an application that declares nothing still has a
usable workbench.

#### Scenario: An undeclared region is not conjured up

- **WHEN** a distribution declares no launcher rail
- **THEN** the workbench draws none
- **AND** a contribution aimed at one is reported to the developer

#### Scenario: The default frame is complete enough to contribute to

- **WHEN** a distribution declares no layout of its own
- **THEN** the default frame includes the regions the workbench's own contributions target

### Requirement: Each kind of region has a fixed anatomy

Each kind of region SHALL have a fixed internal structure that plugins do not extend: a bar has
named slots, a launcher rail has an anchored top and bottom band, a panel has a header with actions
and a body, and the content area has its own strip and body. A plugin SHALL choose a region and a
slot within that fixed vocabulary, and SHALL NOT invent sub-slots.

#### Scenario: A contribution names a region and a place within its anatomy

- **WHEN** a plugin contributes to a bar
- **THEN** it names one of the bar's slots, and the workbench draws it there

#### Scenario: A contribution to the wrong kind of region is reported

- **WHEN** a plugin contributes an item to a region whose kind cannot hold it
- **THEN** the developer is told, naming the kind

### Requirement: Both sides are symmetric

Where the frame offers a side, it SHALL offer both, with identical capabilities. Anything that can
be done on one side SHALL be possible on the other, and each side SHALL be distinguishable by name.

#### Scenario: A view can live on either side

- **WHEN** a view is contributed to a panel on either side
- **THEN** the same capabilities apply to it

### Requirement: A panel can be collapsed and resized, and remembers both

The user SHALL be able to collapse a panel and expand it again, and to change its width by dragging
or from the keyboard. Both SHALL survive a restart, the width SHALL be constrained to a usable
range, and an unreadable stored value SHALL be ignored rather than propagated.

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

- **WHEN** the stored width is unreadable or outside the usable range
- **THEN** it is ignored or brought back into range

#### Scenario: A collapsed rail-less panel gives the space back

- **WHEN** a panel on a side without a launcher rail is collapsed
- **THEN** its column disappears and the content area extends into it
- **AND** a control to expand it again remains reachable

### Requirement: The frame belongs to the application, not to what is in it

A region SHALL be drawn because the distribution declared it, not because something currently
occupies it. A panel holding nothing SHALL stay as the application declared it rather than
collapsing itself.

#### Scenario: An empty panel does not fold itself away

- **WHEN** a declared panel holds no views
- **THEN** it stays in the state the application declared

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

### Requirement: A declared view finds its way to a sidebar exactly once

The workbench SHALL place each declared view into its home sidebar when nothing already holds it,
and SHALL NOT place it again once the user has moved it. A view whose declaration disappears SHALL
be hidden rather than deleted, so that it returns if the declaration comes back.

Placement SHALL happen regardless of whether the current session qualifies for the view; whether it
is *drawn* is decided when it is drawn.

#### Scenario: A moved view is not re-seeded

- **WHEN** the user has moved a view into another dock and the application restarts
- **THEN** the workbench does not place a second copy in its declared home

#### Scenario: A view that vanished from everywhere comes home

- **WHEN** nothing holds a declared view any more
- **THEN** the workbench places it in its declared home again

#### Scenario: A gated view is placed before the session is known

- **WHEN** the workbench starts with no session yet and a view requires a role
- **THEN** the view is still placed
- **AND** it is not drawn until the session qualifies

#### Scenario: A view whose declaration is gone is kept, not discarded

- **WHEN** a stored arrangement names a view that no plugin declares any more
- **THEN** its place is hidden rather than removed

### Requirement: The frame adapts to a narrow viewport

On a viewport too narrow for side panels, the workbench SHALL keep the launcher rail and present a
panel as an overlay that can be dismissed, rather than shrinking the content away.

#### Scenario: A narrow viewport keeps the content usable

- **WHEN** the viewport is too narrow for a side panel beside the content
- **THEN** the panel is presented over the content and can be dismissed
- **AND** the launcher rail remains
