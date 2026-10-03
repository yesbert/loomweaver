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

### Requirement: An entry with a state keeps its icon

An entry that represents something on or off SHALL still show the icon of the command behind it.
The check SHALL have a place of its own, leading, and the icon SHALL follow it, so that a menu
offering a choice among things that each have a symbol can mark the one in effect without losing
the symbols. A menu in which no entry carries a check SHALL reserve no space for one, and a menu in
which no entry carries an icon SHALL reserve no space for that, so a plain menu stays as it is.

#### Scenario: A checked entry shows its check and its icon

- **WHEN** an entry represents a state that is on and the command behind it has an icon
- **THEN** the entry shows the check, then the icon, then its name

#### Scenario: An unchecked entry keeps its icon and its place

- **WHEN** an entry represents a state that is off and the command behind it has an icon
- **THEN** the entry shows the icon and its name, with the check's place left empty so the names
  of checked and unchecked entries line up

#### Scenario: A menu without any state reserves no place for a check

- **WHEN** no entry in a menu represents a state
- **THEN** no space is reserved before the icons, and the menu is drawn as it was before this
  requirement

#### Scenario: What is announced does not change

- **WHEN** an entry with a state and an icon is read by assistive technology
- **THEN** it is announced as a checkable item with its state, and the icon is not announced

#### Scenario: A list to choose from marks the entry in effect and keeps every icon

- **WHEN** the workbench offers a list to choose from, such as the tabs a strip cannot show or the
  instances of a view, and its entries carry icons
- **THEN** the entry in effect shows the check, then its icon, then its name
- **AND** every other entry shows its icon, with the check's place left empty

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

A menu invoked at a point SHALL open at that point. Every menu SHALL be kept within the visible area
rather than extending past an edge.

#### Scenario: A menu near an edge is pulled back into view

- **WHEN** a menu is opened close to the edge of the window
- **THEN** it is positioned so that it remains fully visible

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

### Requirement: An open menu follows its strings

The workbench paints before the translations have arrived, so a menu can be opened while its words
are not there yet. Every menu the workbench draws SHALL therefore be worded again, in place and
without closing, when a translation bundle for the language in effect arrives and when the language
changes to one whose strings are there, keeping the words it has until then:
a declared menu, a menu opened from a control, the heading of either, and a menu a plugin opens
against its own content. The entry that has the focus SHALL keep it, and a menu whose words changed
SHALL be placed again once the chrome around it has been redrawn, so it stays within the window and
beside the control it was opened from, wherever that control now is and however wide its own words
made it. A control that is no longer on the page, or is hidden, leaves the menu where it last stood,
still kept within the window.

The entries of a menu a plugin opens against its own content SHALL take a translation key or a
literal, like every other piece of chrome text that takes either. Every entry SHALL be looked up as
a key and follow the strings; an entry no bundle knows SHALL be shown as it is. The limit: a literal
that happens to equal a key a bundle knows shows that key's text, and development reports a literal
with the shape of a key, such as a file name with a dot, as missing.

The limit: a menu a plugin draws inside its own surface is the plugin's to word, and is not covered.

#### Scenario: A menu opened before the strings is worded once they arrive

- **WHEN** a menu is opened before the bundle for the active language has arrived, so its entries
  show their keys
- **AND** the bundle then arrives while the menu is still open
- **THEN** the open menu shows the translated words, including its heading

#### Scenario: A language chosen while a menu is open reaches that menu

- **WHEN** a menu is open and the language changes, for example from another window of the
  application
- **THEN** the open menu is worded in the new language without closing

#### Scenario: A plugin's menu entry may be a key

- **WHEN** a plugin opens a menu against its own content with one entry labelled by a key of its own
  bundle and one labelled with a literal
- **THEN** the first shows the translation and follows a language change, and the second is shown as
  it is

#### Scenario: A menu that grows with its words stays in the window

- **WHEN** a menu opened close to the right edge of the window is re-worded with longer words
- **THEN** it is placed again so that it remains fully visible

#### Scenario: A menu opened from a control follows that control

- **WHEN** a menu opened from a control is re-worded and the language change moved the control
- **THEN** the menu is placed beside the control where it now is

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
