## ADDED Requirements

### Requirement: A toolbar entry may carry the look of a button

A menu entry SHALL be able to name one variant of the vocabulary the workbench's button offers:
primary, default, success, danger, warning, info or ghost. Where the entry is drawn in a toolbar, it
SHALL be drawn as the workbench's button of that variant is drawn, at the toolbar's size, so that a
toolbar entry and a button of the same variant read the same. An entry that names no variant SHALL
be drawn as every toolbar entry is drawn today. The variant SHALL be a name from that vocabulary and
nothing else: an entry SHALL NOT carry a class, a style or a colour of its own into a toolbar, and a
name outside the vocabulary SHALL be drawn as no variant and reported to the developer.

An entry drawn as primary SHALL show its title, with its icon before it where it has one.

Primary SHALL belong to the plugin that owns the slot the toolbar draws: the plugin that registered
the toolbar, or for a surface's actions the plugin that owns the surface. An entry asking for primary
that any other plugin contributed, or that no plugin contributed, SHALL be drawn as no variant, and
the developer SHALL be told once per entry which plugin asked and whose slot it was. Every other
variant SHALL be open to every contributor, so that a contributed destructive entry can look
dangerous in a toolbar it does not own.

The variant SHALL be honoured only where the entry is drawn in a toolbar. Where the same entry is
offered in a menu, the variant SHALL be ignored, as a nested slot is.

This is held for a toolbar placed by a plugin the workbench renders in the page. A toolbar drawn
inside an isolated surface is covered where that boundary is specified.

#### Scenario: The owner marks its main action

- **WHEN** the plugin that registered a toolbar contributes an entry to its slot naming primary
- **THEN** the toolbar draws the entry as a primary button, showing its title with its icon before
  it

#### Scenario: A primary entry opens what others contributed

- **WHEN** the owner's primary entry also opens a slot, and a second plugin has contributed an entry
  to that slot
- **THEN** the entry is drawn as one primary button that shows it opens a menu, and activating it
  opens the slot with the second plugin's entry in it

#### Scenario: A contributor cannot take the main action

- **WHEN** a plugin contributes an entry naming primary to a toolbar another plugin registered
- **THEN** the entry is drawn as an entry without a variant, and the developer is told once which
  plugin asked and whose toolbar it was

#### Scenario: A contributed destructive entry reads as dangerous

- **WHEN** a plugin contributes an entry naming danger to a toolbar another plugin registered
- **THEN** the entry is drawn as a danger button is drawn

#### Scenario: Without a variant nothing changes

- **WHEN** an entry names no variant
- **THEN** it is drawn exactly as a toolbar entry without a variant was drawn before

#### Scenario: A name outside the vocabulary is not drawn

- **WHEN** an entry names a variant the vocabulary does not hold
- **THEN** the entry is drawn as no variant and the developer is told

#### Scenario: A menu ignores the variant

- **WHEN** an entry naming danger is contributed to a slot that is opened as a menu
- **THEN** the menu offers the entry as it offers any other

## MODIFIED Requirements

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
An entry drawn as primary is the exception, and SHALL show its title whether or not it has an icon.
An entry that shows its title and opens a slot SHALL show visibly that it opens a menu, not only to
assistive technology.

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

#### Scenario: A labelled entry shows that it opens a menu

- **WHEN** an entry without an icon declares that activation opens a menu slot, and that slot has an
  entry
- **THEN** the entry shows its title and a visible sign that it opens a menu, and is announced as
  opening one

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
