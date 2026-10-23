## MODIFIED Requirements

### Requirement: A menu entry may open a submenu beside it

An entry of any menu the workbench draws SHALL be able to open a submenu instead of acting: an entry
contributed to a slot that names another slot to open, an entry of a menu a plugin opens against its
own content that carries entries of its own, and an entry of a menu a plugin draws itself with the
workbench's menu element that holds such an element. A contributed entry that names a slot SHALL be
drawn while that slot offers it an entry, as in a toolbar; with a command as well, it SHALL run the
command while the slot offers nothing.

An entry that opens a submenu SHALL show it visibly, by a mark at its trailing end, SHALL be announced
as opening a menu and whether that menu is open, and SHALL be drawn as current while its submenu is
open. It SHALL be named by its own words, whether its submenu is open or closed: the entries of an
open submenu SHALL NOT count among the words the entry shows. A plugin drawing its own menu SHALL keep
writing a submenu inside the entry it belongs to; how the entry is presented to assistive technology
is the workbench's. The submenu SHALL be placed beside the entry, lined up with it, and on the other side where the
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

#### Scenario: An open submenu is not part of its entry's name

- **WHEN** an entry opens its submenu
- **THEN** the entry is named by its own words alone, and is announced as opening a menu that is open
- **AND** the automated accessibility audit reports no violation with the submenu open

#### Scenario: A submenu written inside its entry keeps working

- **WHEN** a plugin draws its own menu with the workbench's menu element and puts a menu element
  inside one of its entries
- **THEN** that entry opens it as its submenu, and choosing an entry in it reaches the outer menu
