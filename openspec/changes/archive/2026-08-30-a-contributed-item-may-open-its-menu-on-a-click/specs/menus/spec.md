## MODIFIED Requirements

### Requirement: Any contributed control may carry a menu of its own

An item a plugin contributes to the chrome — a launcher entry, a bar button, a view's tab — MAY name
a menu slot, and right-clicking it SHALL open that slot against that item. Where several such
controls are nested, the innermost SHALL win. The browser's own menu SHALL be suppressed where the
workbench opens one.

A launcher entry or a bar button that names a menu slot MAY declare that activating it opens that
slot instead, or that both gestures do. An item that declares nothing SHALL keep the right-click
alone, so an item written before this choice existed behaves exactly as it did.

Activating such an item SHALL offer its own slot alone, without the entries the workbench itself
contributes for that item; those stay on the right-click. Activating SHALL mean the pointer and the
keyboard alike, and the menu SHALL open against the item either way.

An item whose activation opens its menu SHALL be drawn even though it names no other action, since
opening the menu is its purpose. Where such an item also names an action, activation SHALL open the
menu and the workbench SHALL report the ignored action to the author in development.

#### Scenario: A launcher entry carries its own menu

- **WHEN** a plugin names a menu slot on a launcher entry and the user right-clicks it
- **THEN** that slot opens against that entry

#### Scenario: The innermost control wins

- **WHEN** a control carrying a menu sits inside another that also carries one
- **THEN** the inner one's menu opens

#### Scenario: An entry opens its menu when it is activated

- **WHEN** a launcher entry declares that activation opens its menu and the user clicks it
- **THEN** that slot opens against that entry, with the labels, icons and shortcuts of the commands
  behind its entries

#### Scenario: The keyboard opens it too

- **WHEN** the user moves focus to such an entry and activates it from the keyboard
- **THEN** the same menu opens, and dismissing it returns focus to the entry

#### Scenario: The workbench's own entries stay on the right-click

- **WHEN** the user activates an entry whose activation opens its menu
- **THEN** only the entries contributed to the entry's own slot are offered
- **AND** right-clicking the same entry still offers the workbench's entries for it as well

#### Scenario: An entry that exists to open a menu is drawn

- **WHEN** an entry names a menu slot and an opening gesture but no action of its own
- **THEN** it appears in the chrome and opens its menu

### Requirement: A menu opens where the pointer is, and stays on screen

A menu invoked at a point SHALL open at that point. Every menu SHALL be kept within the visible area
rather than extending past an edge.

#### Scenario: A menu near an edge is pulled back into view

- **WHEN** a menu is opened close to the edge of the window
- **THEN** it is positioned so that it remains fully visible

## ADDED Requirements

### Requirement: A menu opened from a control is placed beside that control

A menu the workbench opens from a control rather than at a pointer SHALL be placed beside that
control and SHALL NOT cover it. Where the preferred side has no room for the whole menu, the
workbench SHALL place it on the opposite side rather than pushing it back over the control.

#### Scenario: A control at the bottom of the window opens its menu upwards

- **WHEN** a control near the bottom edge opens a menu taller than the space beneath it
- **THEN** the menu is placed above the control, fully visible, and does not cover it

#### Scenario: A menu opens on the side where there is room

- **WHEN** a control near a side edge opens a menu wider than the space beside it
- **THEN** the menu is placed on the control's other side

### Requirement: A control whose activation opens a menu announces that it does

A control the workbench draws whose activation opens a menu SHALL be announced as opening one, and
SHALL announce whether that menu is currently open. This SHALL hold for a contributed item's own
menu and for the workbench's own controls that open one alike.

#### Scenario: The control is announced as opening a menu

- **WHEN** assistive technology reaches a control whose activation opens a menu
- **THEN** it is announced as opening a menu, and as collapsed while none is open

#### Scenario: The announced state follows the menu

- **WHEN** the menu opens and is then dismissed
- **THEN** the control is announced as expanded while it is open and as collapsed again afterwards
