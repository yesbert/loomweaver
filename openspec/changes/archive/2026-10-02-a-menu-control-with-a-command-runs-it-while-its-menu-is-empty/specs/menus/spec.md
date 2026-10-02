## MODIFIED Requirements

### Requirement: Any contributed control may carry a menu of its own

An item a plugin contributes to the chrome — a launcher entry, a bar button, a view's tab, a
surface's action — MAY name a menu slot, and right-clicking it SHALL open that slot against that
item. Where several such controls are nested, the innermost SHALL win. The browser's own menu SHALL
be suppressed where the workbench opens one.

A launcher entry, a bar button or a surface's action that names a menu slot MAY declare that
activating it opens that slot instead, or that both gestures do. An item that declares nothing SHALL
keep the right-click alone, so an item written before this choice existed behaves exactly as it did.

Activating such an item SHALL offer its own slot alone, without the entries the workbench itself
contributes for that item; those stay on the right-click. Activating SHALL mean the pointer and the
keyboard alike, and the menu SHALL open against the item either way.

An item whose activation opens its menu SHALL be drawn even though it names no other action, since
opening the menu is its purpose, for as long as its slot offers at least one entry to the person
looking at it. While the slot offers none, the item SHALL NOT be drawn, and it SHALL appear and
disappear as entries come and go, so that whoever owns a slot others fill never has to ask what is
in it.

Where such an item also names an action of its own, it SHALL be drawn whether or not its slot offers
an entry. While the slot offers none, activation SHALL run the item's own action, and the item SHALL
be announced as a plain control rather than as one that opens a menu. While the slot offers an
entry, activation SHALL open the menu and SHALL NOT run the action. A heading the item declares for
its menu SHALL NOT count as an entry for this, so an item can lead its menu with its own action and
still run it directly while nothing else is offered. The change from one to the other SHALL follow
the slot without a reload.

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

- **WHEN** an entry names a menu slot and an opening gesture but no action of its own, and the slot
  offers at least one entry
- **THEN** it appears in the chrome and opens its menu

#### Scenario: A surface's action carries its own menu

- **WHEN** a plugin names a menu slot on a surface's action and the user right-clicks the action
- **THEN** that slot opens against that action

#### Scenario: A surface's action opens its menu when it is activated

- **WHEN** a surface's action declares that activation opens its menu and the user activates it,
  by pointer or by keyboard
- **THEN** that slot opens beside the action

#### Scenario: A control with an empty menu is not drawn

- **WHEN** an item's activation opens its menu, the item names no action of its own, and nothing
  has contributed an entry the current session may see
- **THEN** the item is not drawn

#### Scenario: The control appears once its menu has an entry

- **WHEN** another plugin contributes an entry to that slot while the workbench is running
- **THEN** the item appears, and disappears again when the entry is withdrawn

#### Scenario: A control with an action of its own runs it while its menu is empty

- **WHEN** an item names an action of its own and a menu to open on activation, nothing has
  contributed to that menu, and the user activates the item
- **THEN** the item's own action runs and no menu opens

#### Scenario: The same control opens its menu once the menu has an entry

- **WHEN** another plugin contributes an entry to that menu and the user activates the item
- **THEN** the menu opens against the item and the item's own action does not run

#### Scenario: A heading that leads to the item's action does not hold the menu open alone

- **WHEN** the item declares a heading that names its own action and the slot holds no entry
- **THEN** activation runs the action directly, and no menu showing only the heading opens

#### Scenario: The announcement follows what activation will do

- **WHEN** assistive technology reaches such an item while its menu is empty
- **THEN** it is announced as a plain control, and as one that opens a menu once the menu has an
  entry
