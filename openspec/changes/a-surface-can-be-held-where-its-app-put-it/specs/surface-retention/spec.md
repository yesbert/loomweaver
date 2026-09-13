## MODIFIED Requirements

### Requirement: A hidden surface is destroyed once it is clean

When a surface stops being visible the workbench SHALL destroy it, unless it says it has unsaved
work, its declaration asks to be kept, or it is held where its product put it. This SHALL apply
uniformly to every way of hiding something: switching what a pane shows, collapsing a panel, blowing
up another pane, and moving between arrangements.

#### Scenario: An ordinary surface does not linger

- **WHEN** a surface with nothing unsaved is hidden
- **THEN** it is destroyed, and rebuilt when it is shown again

#### Scenario: Collapsing a panel really unmounts what was in it

- **WHEN** a panel is collapsed
- **THEN** its content leaves the document rather than being hidden in place, unless that content is
  held

#### Scenario: The same rule applies on a narrow viewport

- **WHEN** the overlay panel of a narrow viewport is closed
- **THEN** it holds no content

## ADDED Requirements

### Requirement: A surface may hold its nodes where it put them

A docked surface running in the page SHALL be able to switch on, for its own instance, that the
workbench leaves its rendered nodes where they are. A product uses this while it shows the surface
somewhere the workbench does not draw, such as a window of its own, so that the one live instance
goes on running there.

While an instance is held, the workbench SHALL NOT take its nodes out of the document, hide them,
move them or put them back in their place, whatever it does to the panel, pane or workspace the
surface belongs to, and SHALL NOT destroy the instance for being hidden.

When the switch is turned off, the workbench SHALL treat the instance as it would have if it had
never been held: if the place it belongs to is visible, its nodes are put back there; if not, the
ordinary rules for a hidden surface apply.

Holding SHALL NOT prevent closing. Closing the view, turning off the plugin that contributed it or
resetting the arrangement it belongs to SHALL end a held instance as it ends any other, with its
nodes leaving the document wherever they are.

The workbench SHALL NOT detect on its own that nodes were moved, nor offer any gesture, window or
presentation for showing a surface elsewhere; the switch is the whole of what it provides. A
routable surface has no such switch, and neither has an isolated surface, which cannot be moved into
another window without being reloaded.

#### Scenario: Collapsing the panel leaves a held surface where it is

- **WHEN** a docked surface has switched holding on and its product has moved its nodes into a window
  of its own
- **AND** the panel the surface belongs to is collapsed
- **THEN** the surface's nodes stay in that window and the surface keeps running

#### Scenario: Switching what is shown does not hide a held surface

- **WHEN** a held surface's view is replaced in its panel by another view, or its workspace is left
- **THEN** its nodes are neither hidden nor moved

#### Scenario: A held surface is not pulled back

- **WHEN** the workbench changes anything while a surface is held with its nodes outside their place
- **THEN** the nodes stay where the product put them

#### Scenario: A held surface is not destroyed for being hidden

- **WHEN** a held surface with nothing unsaved and no request to be kept is hidden
- **THEN** it is not destroyed

#### Scenario: Turning holding off puts a visible surface back

- **WHEN** holding is switched off while the place the surface belongs to is visible
- **THEN** its nodes are put back in that place

#### Scenario: Turning holding off applies what was deferred

- **WHEN** holding is switched off while the panel the surface belongs to is collapsed
- **THEN** the surface is treated as a hidden surface, kept or destroyed by the ordinary rules

#### Scenario: Closing still closes a held surface

- **WHEN** the view of a held surface is closed, or the plugin that contributed it is turned off
- **THEN** the instance is ended and its nodes leave the document wherever they are

#### Scenario: A surface that never holds is unaffected

- **WHEN** a surface never switches holding on
- **THEN** it is hidden, released, moved and repaired exactly as before
