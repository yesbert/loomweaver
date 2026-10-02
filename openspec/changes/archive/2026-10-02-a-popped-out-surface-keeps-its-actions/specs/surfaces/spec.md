## MODIFIED Requirements

### Requirement: A surface's actions are drawn wherever the surface stands

The actions a surface declares SHALL be drawn in the header of whatever holds the surface while it
is the one shown there: the header of a panel, and the header of a pane of the content area, whether
that pane carries the address or not and whether it shows a tab strip or only its floating controls.
In a pane they SHALL stand before the pane's own controls, in the order the actions give, and they
SHALL follow the surface when it is moved to another pane or panel.

An action SHALL behave the same in every header: it runs what it names, is hidden or disabled as its
access requirement says, shows its toggle state, and follows a replacement made while the surface is
mounted. Only the actions of the surface currently shown SHALL be drawn; a surface in a tab that is
not the active one contributes none.

In a detached window, which has no header of its own, the actions SHALL be drawn in a bar above the
surface, and that bar SHALL be absent where the surface offers no action there. An action that names
a command SHALL be drawn there only if that command declares itself suitable for a detached window.

The limit of that: a sandboxed surface carries no actions, so there is nothing of its to draw.

#### Scenario: A content surface's action is drawn in its pane's header

- **WHEN** a plugin registers a routable surface with an action and that surface is the active tab of
  a content pane
- **THEN** the pane's header shows the action before the pane's own controls
- **AND** activating it runs what the action names

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

#### Scenario: A detached surface keeps its actions

- **WHEN** a surface with actions is opened in a window of its own
- **THEN** its actions are drawn in a bar above it, and activating one runs what it names

#### Scenario: A detached surface without usable actions stays bare

- **WHEN** no action of the surface remains to draw once its access requirements and the rule for
  commands in a detached window are applied
- **THEN** the window shows the surface alone, with no bar
