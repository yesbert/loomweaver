## ADDED Requirements

### Requirement: A menu entry may open a submenu beside it

An entry of any menu the workbench draws SHALL be able to open a submenu instead of acting: an entry
contributed to a slot that names another slot to open, an entry of a menu a plugin opens against its
own content that carries entries of its own, and an entry of a menu a plugin draws itself with the
workbench's menu element that holds such an element. A contributed entry that names a slot SHALL be
drawn while that slot offers it an entry, as in a toolbar; with a command as well, it SHALL run the
command while the slot offers nothing.

An entry that opens a submenu SHALL show it visibly, by a mark at its trailing end, SHALL be announced
as opening a menu and whether that menu is open, and SHALL be drawn as current while its submenu is
open. The submenu SHALL be placed beside the entry, lined up with it, and on the other side where the
preferred side has no room, kept within the window like every menu. Entries of a submenu SHALL show
icons, shortcuts, states, separators and words exactly as the menu it opens from, and SHALL follow the
strings the same way.

A submenu SHALL be part of the menu it opens from: opening it SHALL NOT close that menu, and a click
inside either SHALL NOT count as a click outside. Choosing an entry in a submenu SHALL close every
level and return focus to what the menu was opened from.

Resting the pointer on the entry SHALL open its submenu after a short pause, resting on another entry
of the same menu SHALL close it after the same pause, and moving the pointer into the submenu SHALL
keep it open. Activating the entry by click or tap SHALL open the submenu at once.

From the keyboard, the right arrow, Enter and Space on the entry SHALL open the submenu and move focus
to its first entry that can be used. In the submenu, the left arrow and the dismiss key SHALL close
it and return focus to the entry, and Tab SHALL close the whole menu. The arrow keys, Home and End
SHALL move within the menu that has the focus only.

The limits: the mark, the placement and the keyboard are verified on host-rendered menus; a menu drawn
inside an isolated surface runs the same element and is not tested separately. A submenu that would
lead back to a slot already open above it is not drawn.

#### Scenario: A contributed entry opens its slot as a submenu

- **WHEN** an entry of a menu names another slot to open, and that slot offers an entry
- **THEN** the entry shows that it opens a menu, and activating it opens that slot beside it with the
  same context the menu was opened with

#### Scenario: An entry whose slot is empty runs its command

- **WHEN** an entry names a slot to open and a command, and the slot offers nothing to the session
- **THEN** the entry is drawn as an ordinary entry and choosing it runs the command

#### Scenario: A plugin's menu entry carries entries of its own

- **WHEN** a plugin opens a menu against its own content with an entry that carries four entries,
  each with an icon and a shortcut
- **THEN** that entry opens a submenu with the four entries, their icons and their shortcuts, and
  choosing one runs it and closes both menus

#### Scenario: The keyboard walks into a submenu and back out

- **WHEN** the user moves to an entry that opens a submenu and presses the right arrow
- **THEN** the submenu opens with focus on its first entry
- **AND** the left arrow closes it and puts focus back on the entry, with the menu still open

#### Scenario: The pointer opens a submenu by resting on its entry

- **WHEN** the user rests the pointer on an entry that opens a submenu
- **THEN** the submenu opens beside it, and stays open while the pointer moves into it

#### Scenario: A submenu near the window edge opens on the other side

- **WHEN** a menu stands so close to the right edge that its submenu has no room on the right
- **THEN** the submenu opens on the left of the menu, fully visible

### Requirement: An entry of a plugin's own menu may show a shortcut

An entry of a menu a plugin opens against its own content SHALL be able to name a keyboard shortcut,
in the same vocabulary a command's shortcut uses. The menu SHALL show it as it shows a command's
shortcut: trailing, written the way the platform writes keys, and not announced. Wherever the
workbench writes a shortcut, the arrow keys SHALL be written as arrows.

The limit: the shortcut is a hint. The workbench does not bind the keys; the plugin handles them for
its own content.

#### Scenario: A plugin's entry shows the keys that do the same

- **WHEN** a plugin opens a menu against its own content with an entry naming the shortcut Shift with
  the up arrow
- **THEN** the entry shows that shortcut at its end, with an arrow for the arrow key, and it is not
  read out as part of the entry

## MODIFIED Requirements

### Requirement: A menu is operable by keyboard and dismisses predictably

A menu SHALL be navigable and activatable from the keyboard, SHALL skip entries that cannot be used,
SHALL close on the dismiss key and on a click outside it, and SHALL return focus to what opened it.
Only one menu SHALL be open at a time. A submenu belongs to the menu it opens from and is not a second
menu: it SHALL open without closing that menu, and the dismiss key in a submenu SHALL close the
submenu alone.

#### Scenario: The keyboard drives the menu

- **WHEN** the user moves through a menu with the arrow keys and activates an entry
- **THEN** unusable entries are skipped and the chosen entry runs

#### Scenario: Dismissing returns the user where they were

- **WHEN** the menu is dismissed by key or by clicking outside it
- **THEN** it closes and focus returns to what opened it

#### Scenario: Opening a menu closes any other

- **WHEN** a menu is opened while another is open
- **THEN** the first closes

#### Scenario: Dismissing a submenu keeps its menu open

- **WHEN** a submenu is open and the user presses the dismiss key
- **THEN** the submenu closes, the menu it opened from stays open, and focus is on the entry that
  opened it
