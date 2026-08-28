# menus Specification

## Purpose
A menu is a named place where commands collect, which anything can contribute to: the workbench's
own tab and view menus, and any menu a plugin declares on something it draws. A context menu is the
same thing opened at a point, against the thing under the pointer.

## Requirements

### Requirement: A menu is a named slot that anything may contribute to

The workbench SHALL identify menus by name, and a plugin SHALL be able to add an entry to any of
them, including the workbench's own. An entry SHALL name the command it runs rather than carrying an
implementation, so that the same action is reachable from the menu and from anywhere else.

An entry MAY instead carry an inline implementation, for a menu a plugin opens against its own
content.

#### Scenario: A plugin adds to a menu the workbench draws

- **WHEN** a plugin contributes an entry to the workbench's own tab menu
- **THEN** the entry appears there and runs its command

#### Scenario: A menu nobody contributed to does not open

- **WHEN** a menu slot has no matching entries
- **THEN** nothing opens

### Requirement: A menu entry knows what it was opened against

Opening a menu SHALL carry a description of the thing it was opened against, and the command SHALL
receive it. An entry MAY declare that it applies only when that description matches given values, so
that entries which make no sense for this particular thing are not offered.

The matching SHALL be a comparison of named values, not an expression language.

#### Scenario: The command acts on the thing under the pointer

- **WHEN** the user opens a tab's menu and chooses an action
- **THEN** it acts on that tab, not on whichever one happens to be active

#### Scenario: An entry that does not apply is not offered

- **WHEN** an entry declares that it applies only to closable items and the item is not closable
- **THEN** it is not offered

### Requirement: A menu is ordered, grouped and separated

Entries SHALL be ordered by their declared group and then by their declared position within it, and
the workbench SHALL draw a separator between groups. This SHALL hold regardless of the order in
which plugins registered.

#### Scenario: Independently contributed entries land in a predictable order

- **WHEN** several plugins contribute entries in different groups
- **THEN** they appear grouped, separated, and ordered within each group

### Requirement: An entry that cannot work is not drawn

An entry naming a command that nothing registers — or that a distribution has removed — SHALL be
dropped rather than drawn as a dead control showing its raw identity. An entry with nothing to
label it SHALL likewise be dropped.

#### Scenario: An entry whose command was removed disappears with it

- **WHEN** a distribution removes a command that a menu entry names
- **THEN** the entry is not drawn

#### Scenario: An entry with no label is not drawn

- **WHEN** an entry carries neither a command to take a label from nor one of its own
- **THEN** it is not drawn

### Requirement: A menu is operable by keyboard and dismisses predictably

A menu SHALL be navigable and activatable from the keyboard, SHALL skip entries that cannot be used,
SHALL close on the dismiss key and on a click outside it, and SHALL return focus to what opened it.
Only one menu SHALL be open at a time.

#### Scenario: The keyboard drives the menu

- **WHEN** the user moves through a menu with the arrow keys and activates an entry
- **THEN** unusable entries are skipped and the chosen entry runs

#### Scenario: Dismissing returns the user where they were

- **WHEN** the menu is dismissed by key or by clicking outside it
- **THEN** it closes and focus returns to what opened it

#### Scenario: Opening a menu closes any other

- **WHEN** a menu is opened while another is open
- **THEN** the first closes

### Requirement: An entry may show a state rather than only an action

An entry MAY represent something that is on or off, in which case it SHALL be announced as such and
SHALL reflect the current state of the thing the menu was opened against.

#### Scenario: A toggle reflects and changes the state

- **WHEN** the user opens the menu of a pinned tab
- **THEN** the pin entry shows as on
- **AND** choosing it turns it off

### Requirement: An entry shows the icon and shortcut of the command behind it

Where the command an entry names has an icon or a keyboard shortcut, the menu SHALL show them: the
icon leading, the shortcut trailing and not announced, since it is a hint rather than content. Space
for the leading icon SHALL be reserved only where some entry uses one.

#### Scenario: A shortcut is shown but not announced

- **WHEN** an entry's command declares a shortcut
- **THEN** it is shown at the end of the entry and is not read out as part of it

### Requirement: Any contributed control may carry a menu of its own

An item a plugin contributes to the chrome — a launcher entry, a bar button, a view's tab — MAY name
a menu slot, and right-clicking it SHALL open that slot against that item. Where several such
controls are nested, the innermost SHALL win. The browser's own menu SHALL be suppressed where the
workbench opens one.

#### Scenario: A launcher entry carries its own menu

- **WHEN** a plugin names a menu slot on a launcher entry and the user right-clicks it
- **THEN** that slot opens against that entry

#### Scenario: The innermost control wins

- **WHEN** a control carrying a menu sits inside another that also carries one
- **THEN** the inner one's menu opens

### Requirement: A plugin drawing its own surface draws its own menu

Where a plugin draws its own content — including content running isolated from the workbench — it
SHALL draw its own context menu there, using the workbench's own menu element so that it looks and
behaves like every other menu. The workbench SHALL NOT draw a menu into a plugin's own surface.

#### Scenario: An isolated surface opens its own menu, in place

- **WHEN** the user right-clicks inside an isolated plugin surface that offers a menu
- **THEN** the menu opens at the pointer inside that surface, and choosing an entry acts there
  without crossing back to the workbench

#### Scenario: A menu drawn by a plugin still looks like the workbench's

- **WHEN** a plugin draws a menu with the workbench's menu element
- **THEN** it takes the workbench's own appearance, including in dark presentation

### Requirement: A menu opens where the pointer is, and stays on screen

A menu SHALL open at the point it was invoked and SHALL be kept within the visible area rather than
extending past an edge.

#### Scenario: A menu near an edge is pulled back into view

- **WHEN** a menu is opened close to the edge of the window
- **THEN** it is positioned so that it remains fully visible
