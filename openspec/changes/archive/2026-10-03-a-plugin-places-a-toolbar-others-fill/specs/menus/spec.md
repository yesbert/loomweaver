## MODIFIED Requirements

### Requirement: A menu is a named slot that anything may contribute to

The workbench SHALL identify menus by name, and a plugin SHALL be able to add an entry to any of
them, including the workbench's own. An entry SHALL name the command it runs rather than carrying an
implementation, so that the same action is reachable from the menu and from anywhere else.

An entry MAY instead carry an inline implementation, for a menu a plugin opens against its own
content.

A slot SHALL be **declared** before it is drawn: by the workbench for the slots it draws itself, by
a contributed control that names the slot as its menu, or by a toolbar a plugin registers. An entry
contributed to a slot nothing declares SHALL be kept, so that it appears once the slot is declared,
and SHALL be reported to the developer once the composition is complete rather than at the moment
of registration, because the plugin that fills a slot may activate before the plugin that owns it.

#### Scenario: A plugin adds to a menu the workbench draws

- **WHEN** a plugin contributes an entry to the workbench's own tab menu
- **THEN** the entry appears there and runs its command

#### Scenario: A menu nobody contributed to does not open

- **WHEN** a menu slot has no matching entries
- **THEN** nothing opens

#### Scenario: An entry registered before its slot is declared is kept

- **WHEN** a plugin contributes an entry to a slot, and another plugin that activates later declares
  that slot on a control or a toolbar
- **THEN** the entry is drawn there, and nothing is reported

#### Scenario: An entry aimed at a slot nothing declares is reported, once

- **WHEN** every composed plugin has activated and an entry names a slot no control, toolbar or
  workbench menu declares
- **THEN** the developer is told, naming the entry and the slot

## ADDED Requirements

### Requirement: A slot may be drawn as a toolbar wherever a plugin places it

A plugin SHALL be able to register a toolbar under a slot of its own and place it in its own
content, as many times as it likes, with the workbench's element for it. Each placement SHALL carry
a description of what it stands beside, of the same shape a menu is opened against, and a name,
given by the plugin, by which assistive technology announces the toolbar. A placement without a
name SHALL take the name the toolbar was registered with, so that no toolbar is announced as a
nameless group of controls.

A toolbar SHALL draw the entries of its slot the way a menu would offer them, open and side by
side: the same contributions, by the same registration any plugin uses for a menu, matched against
the placement's description by the same comparison of named values, grouped and ordered the same
way with a separator between groups, labelled and iconed from the command where the entry names
one, and dropped where the command is unregistered, removed, or one the session may not run or that
does not belong in the window. An entry that represents a state SHALL be drawn and announced as
pressed or not. An entry with no icon SHALL show its title; an entry with an icon SHALL show the
icon and offer its title as a tooltip, and SHALL show its command's shortcut there where it has one.

Activating an entry SHALL run its command with the placement's description as the command's
context, through the one place every trigger runs through. An entry that names a menu slot and an
opening gesture SHALL open that slot beside itself, as a bar button does, so a toolbar carries
nested menus without a mechanism of its own.

A toolbar whose slot offers nothing to the person looking at it SHALL take no space, and SHALL
appear and disappear as entries come and go without the plugin that placed it asking what is in
it. The toolbar SHALL be operable from the keyboard as a single stop, with the arrow keys moving
between its entries.

The slot a toolbar is registered under belongs to the plugin that registered it and is part of what
it publishes to the plugins meant to fill it. A toolbar registered under a slot another plugin
already registered a toolbar for SHALL be refused and reported, naming both.

This is held for a toolbar placed by a plugin the workbench renders in the page. A toolbar drawn
inside an isolated surface is covered where that boundary is specified.

#### Scenario: A toolbar shows what a second plugin contributed

- **WHEN** one plugin registers a toolbar and places it beside a record, and a second plugin
  contributes an entry to that slot naming a command of its own
- **THEN** the toolbar shows the entry with the command's title and icon, and activating it runs the
  command with the record's description

#### Scenario: Each placement is matched on its own description

- **WHEN** the same toolbar is placed beside two records whose descriptions differ, and an entry
  declares that it applies only to one kind of them
- **THEN** the entry is drawn in one placement and not in the other

#### Scenario: A toolbar drops what the session may not run

- **WHEN** an entry of a toolbar names a command the session does not qualify for
- **THEN** it is not drawn, and it appears once the session qualifies, without a reload

#### Scenario: An empty toolbar takes no space

- **WHEN** a toolbar is placed and its slot offers no entry the current session may see
- **THEN** nothing is drawn where it stands, and the toolbar appears once an entry is contributed

#### Scenario: A toolbar entry opens a nested menu

- **WHEN** an entry declares that activation opens a menu slot, that slot has an entry, and the user
  activates it by pointer or keyboard
- **THEN** that slot opens beside the entry, against the placement's description

#### Scenario: A toggling entry shows its state

- **WHEN** an entry declares that it represents a state and the placement's description says the
  state is on
- **THEN** the entry is drawn and announced as pressed

#### Scenario: Two owners cannot claim one slot

- **WHEN** a plugin registers a toolbar under a slot another plugin already registered a toolbar for
- **THEN** the second registration is refused and the developer is told which two plugins collided

#### Scenario: A toolbar is announced by the name its plugin gave

- **WHEN** assistive technology reaches a placed toolbar
- **THEN** it is announced as a toolbar by the name given on the placement, or by the name the
  toolbar was registered with where the placement gives none

#### Scenario: The keyboard moves through a toolbar

- **WHEN** focus reaches a toolbar and the user presses the arrow keys
- **THEN** focus moves between its entries, and the toolbar is one stop in the page's tab order

### Requirement: A toolbar folds what it cannot show

Where a toolbar cannot show every entry at its natural width, it SHALL fold the entries that do not
fit into a control at its end, from the end backwards, and that control SHALL offer the folded
entries as a menu so that each can still be read and used. An entry SHALL NOT be drawn over another
and SHALL NOT be cut off. Folding SHALL follow the toolbar's width in both directions, and a toolbar
in which everything fits SHALL show no fold control.

#### Scenario: The last entries fold into a menu

- **WHEN** a toolbar is narrower than its entries
- **THEN** the entries at its end are absent from the row and offered by a fold control, and the
  remaining entries are shown whole

#### Scenario: Folding follows the width

- **WHEN** the toolbar widens enough for a folded entry to fit
- **THEN** that entry returns to the row, and the fold control disappears once nothing is folded

### Requirement: A toolbar may hold a cell a plugin draws itself

A plugin the workbench renders in the page SHALL be able to put a control of its own into a
toolbar: the plugin that placed the toolbar by placing the control inside the element, and any
plugin by registering a cell against the slot. A cell SHALL carry an order and MAY carry an access
requirement, which SHALL only ever hide it, since the workbench does not draw its inside. A cell
SHALL be told the description of the placement it stands in.

The workbench SHALL NOT look inside a cell: it has no command, matches no description, shows no
shortcut and is folded whole when the toolbar is too narrow for it.

The limit of this: a cell is code, and code does not cross the boundary to an isolated surface. A
cell registered against the slot of a toolbar drawn inside an isolated surface SHALL NOT appear
there, and a plugin running isolated SHALL NOT be able to register one.

#### Scenario: The owner places its own control in the toolbar

- **WHEN** a plugin places a control of its own inside the toolbar element it placed
- **THEN** the control is drawn among the entries, at the position its order gives it

#### Scenario: A second plugin registers a cell

- **WHEN** another plugin in the page registers a cell against the toolbar's slot
- **THEN** the cell is drawn in the toolbar and is told the placement's description

#### Scenario: A cell the session does not qualify for is hidden

- **WHEN** a cell carries an access requirement the session does not meet
- **THEN** it is absent, whatever the requirement asked for

#### Scenario: A cell folds whole

- **WHEN** a toolbar is too narrow to show a cell
- **THEN** the cell is absent from the row and presented by the fold control in the form it has

#### Scenario: A cell does not reach an isolated surface

- **WHEN** a plugin in the page registers a cell against a slot whose toolbar is drawn inside an
  isolated surface
- **THEN** the cell is not drawn there, and the declarative entries of the slot are
