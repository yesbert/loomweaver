## MODIFIED Requirements

### Requirement: A surface's actions are drawn wherever the surface stands

The actions a surface declares SHALL be drawn in the header of whatever holds the surface while it
is the one shown there: the header of a panel, and the header of a pane of the content area, whether
that pane carries the address or not and whether it shows a tab strip or only its floating controls.
In a pane they SHALL stand before the pane's own controls, in the order the actions give, and they
SHALL follow the surface when it is moved to another pane or panel.

The actions SHALL be the surface's own toolbar, on a slot named for the surface that the surface's
registration declares. The actions declared on the surface SHALL be the entries its owner
contributes to that slot, and SHALL keep working declared as they are today. Any other plugin MAY
contribute an entry to that slot the way it contributes to a menu, and the workbench SHALL draw it
among the surface's actions, matched against a description that names the surface. The owner of the
surface SHALL be able to tell its own actions from contributed ones by the plugin that contributed
each, and a distribution SHALL be able to remove a contributed one by its identity as it removes any
contribution.

An action SHALL behave the same in every header: it runs what it names, is hidden or disabled as its
access requirement says and is not drawn where the command it names may not run, shows its toggle
state, and follows a replacement made while the surface is mounted. Only the actions of the surface
currently shown SHALL be drawn; a surface in a tab that is not the active one contributes none.

In a detached window, which has no header of its own, the actions SHALL be drawn in a bar above the
surface, and that bar SHALL be absent where the surface offers no action there. An action that names
a command SHALL be drawn there only if that command declares itself suitable for a detached window.

The limit of that: a sandboxed surface's declaration carries no actions. Entries a plugin
contributes to its slot are drawn in its header all the same, including entries the sandboxed plugin
itself contributes through its channel, since a menu entry is data and crosses the boundary.

#### Scenario: A content surface's action is drawn in its pane's header

- **WHEN** a plugin registers a routable surface with an action and that surface is the active tab of
  a content pane
- **THEN** the pane's header shows the action before the pane's own controls
- **AND** activating it runs what the action names

#### Scenario: Another plugin adds to a surface's header

- **WHEN** a second plugin contributes an entry to the slot named for a surface, naming a command of
  its own
- **THEN** the entry is drawn among that surface's actions wherever the surface stands, and
  activating it runs the command with a description naming the surface

#### Scenario: The actions change with the active tab

- **WHEN** the user switches to a tab whose surface declares other actions, or none
- **THEN** the header shows that surface's actions and no longer the previous one's

#### Scenario: A pane without a tab strip still shows them

- **WHEN** the surface is shown in a pane that draws only its floating controls
- **THEN** the actions are drawn with those controls

#### Scenario: The actions follow the surface into another pane

- **WHEN** a surface with actions is moved from a panel into a content pane, or into a second pane
- **THEN** its actions are drawn in the header of the pane it now stands in, and no longer where it
  was

#### Scenario: A replaced action is followed in a pane header

- **WHEN** a plugin replaces an action of a surface shown in a content pane
- **THEN** the pane's header shows the replacement, and the surface is not rebuilt

#### Scenario: An action naming a command the session may not run is not drawn

- **WHEN** an action declares no requirement of its own and names a command whose requirement the
  session does not meet
- **THEN** the action is not drawn in any header, and appears once the session qualifies

#### Scenario: A detached surface keeps its actions

- **WHEN** a surface with actions is opened in a window of its own
- **THEN** its actions are drawn in a bar above it, and activating one runs what it names

#### Scenario: A detached surface without usable actions stays bare

- **WHEN** no action of the surface remains to draw once its access requirements and the rule for
  commands in a detached window are applied
- **THEN** the window shows the surface alone, with no bar

#### Scenario: A sandboxed surface gains a header entry through its channel

- **WHEN** an isolated plugin contributes a menu entry to the slot named for its own surface
- **THEN** the entry is drawn in that surface's header, and activating it runs the command it names
