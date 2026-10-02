## MODIFIED Requirements

### Requirement: An entry that cannot work is not drawn

An entry naming a command that nothing registers — or that a distribution has removed — SHALL be
dropped rather than drawn as a dead control showing its raw identity. An entry with nothing to
label it SHALL likewise be dropped.

An entry naming a command the current session may not run SHALL be dropped too, whether the session
does not meet what the command requires or the window is one the command does not belong in. It
SHALL appear once the session qualifies. A menu left with no entry by this SHALL NOT open. An entry
that carries behaviour of its own rather than a command is not affected, since nothing declares who
it is for.

#### Scenario: An entry whose command was removed disappears with it

- **WHEN** a distribution removes a command that a menu entry names
- **THEN** the entry is not drawn

#### Scenario: An entry with no label is not drawn

- **WHEN** an entry carries neither a command to take a label from nor one of its own
- **THEN** it is not drawn

#### Scenario: An entry whose command the session may not run is not drawn

- **WHEN** a menu is opened and one of its entries names a command the session does not qualify for
- **THEN** that entry is not drawn, and the others are

#### Scenario: The entry appears once the session qualifies

- **WHEN** the session comes to meet what the command requires and the menu is opened again
- **THEN** the entry is drawn

#### Scenario: A menu whose every entry is refused does not open

- **WHEN** every entry of a slot names a command the session may not run
- **THEN** opening the slot shows nothing

#### Scenario: A detached window offers only the commands that belong there

- **WHEN** a menu is opened in a detached window
- **THEN** an entry naming a command that does not declare itself suitable for that window is not
  drawn

### Requirement: A menu opened from a control may name what it was opened against

An item whose activation opens its menu MAY declare a heading for that menu: a name, an optional
second line, and optionally an icon, a short mark or a picture drawn in their place. The workbench
SHALL draw the heading above the first entry.

Where the heading carries a picture that cannot be shown, the workbench SHALL fall back to the short
mark, and to the icon where there is no mark, the same way an entry in the chrome does.

A heading MAY name a command, so that it leads to what it names. Where the command can run, the
heading SHALL be the menu's first entry: the keyboard SHALL reach it first, a click, Enter or Space
SHALL run the command with the menu's context and close the menu, and it SHALL show under the pointer
and in focus the way an entry does. A menu whose only entry is such a heading SHALL still open.

A heading that names no command SHALL NOT be an entry, and neither SHALL one that names a command
nothing registers, a command the distribution removed, or a command the current session may not
run: it SHALL NOT be focusable, SHALL be passed over by keyboard navigation the way a separator is,
and SHALL NOT be activatable by any gesture.

The menu SHALL be announced by what the heading names, and what the heading shows SHALL NOT be read a
second time as content, so the name reaches the user exactly once. A heading that is an entry SHALL
be announced by what its command does.

A menu opened at a pointer SHALL carry no heading, since the thing it was opened against is under the
pointer.

#### Scenario: The menu names the account it belongs to

- **WHEN** an item that opens its menu on activation declares a heading and the user opens it
- **THEN** the name and its second line are shown above the first entry

#### Scenario: The keyboard passes over the heading

- **WHEN** the heading names no command and the user moves through that menu with the arrow keys
- **THEN** the first entry is reached directly, and no gesture activates the heading

#### Scenario: The name is announced once

- **WHEN** assistive technology reaches a menu that carries a heading
- **THEN** the menu is announced by that name, and the heading is not read again as the name

#### Scenario: A heading picture that cannot be shown gives way

- **WHEN** the picture a heading carries fails to load
- **THEN** the heading draws its short mark or its icon instead
- **AND** the name and the second line are unchanged

#### Scenario: A heading that names a command leads to what it names

- **WHEN** the heading names a command the session may run and the user clicks it
- **THEN** the command runs with the menu's context and the menu closes

#### Scenario: The keyboard reaches a leading heading first

- **WHEN** the heading names a command the session may run and the user opens the menu and presses
  the down arrow
- **THEN** the heading is the entry in focus, and Enter or Space runs its command

#### Scenario: A leading heading is announced by what it does

- **WHEN** assistive technology reaches a heading that names a command the session may run
- **THEN** it is announced as an entry by what the command does, while the menu is still announced
  by the name

#### Scenario: A heading whose command cannot run stays a heading

- **WHEN** the heading names a command that nothing registers
- **THEN** it is drawn as a plain heading, the keyboard passes over it, and nothing activates it

#### Scenario: A menu that only leads somewhere still opens

- **WHEN** the heading names a command the session may run and the menu has no other entry
- **THEN** the menu opens with the heading as its only entry

#### Scenario: A heading whose command the session may not run stays a heading

- **WHEN** the heading names a registered command the session does not qualify for
- **THEN** it is drawn as a plain heading, the keyboard passes over it, and nothing activates it
- **AND** it becomes the first entry once the session qualifies and the menu is opened again
