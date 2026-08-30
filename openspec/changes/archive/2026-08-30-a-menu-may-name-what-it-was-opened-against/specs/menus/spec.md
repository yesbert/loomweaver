## ADDED Requirements

### Requirement: A menu opened from a control may name what it was opened against

An item whose activation opens its menu MAY declare a heading for that menu: a name, an optional
second line, and optionally an icon or a short mark drawn in its place. The workbench SHALL draw the
heading above the first entry.

The heading SHALL NOT be an entry: it SHALL NOT be focusable, SHALL be passed over by keyboard
navigation the way a separator is, and SHALL NOT be activatable by any gesture.

The menu SHALL be announced by what the heading names, and what the heading shows SHALL NOT be read a
second time as content, so the name reaches the user exactly once.

A menu opened at a pointer SHALL carry no heading, since the thing it was opened against is under the
pointer.

#### Scenario: The menu names the account it belongs to

- **WHEN** an item that opens its menu on activation declares a heading and the user opens it
- **THEN** the name and its second line are shown above the first entry

#### Scenario: The keyboard passes over the heading

- **WHEN** the user moves through that menu with the arrow keys
- **THEN** the first entry is reached directly, and no gesture activates the heading

#### Scenario: The name is announced once

- **WHEN** assistive technology reaches a menu that carries a heading
- **THEN** the menu is announced by that name, and the heading is not read again as an entry
