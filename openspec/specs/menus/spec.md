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

A heading that names no command, or names one that nothing registers or that the distribution
removed, SHALL NOT be an entry: it SHALL NOT be focusable, SHALL be passed over by keyboard
navigation the way a separator is, and SHALL NOT be activatable by any gesture.

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

- **WHEN** the heading names a registered command and the user clicks it
- **THEN** the command runs with the menu's context and the menu closes

#### Scenario: The keyboard reaches a leading heading first

- **WHEN** the heading names a registered command and the user opens the menu and presses the down
  arrow
- **THEN** the heading is the entry in focus, and Enter or Space runs its command

#### Scenario: A leading heading is announced by what it does

- **WHEN** assistive technology reaches a heading that names a registered command
- **THEN** it is announced as an entry by what the command does, while the menu is still announced
  by the name

#### Scenario: A heading whose command cannot run stays a heading

- **WHEN** the heading names a command that nothing registers
- **THEN** it is drawn as a plain heading, the keyboard passes over it, and nothing activates it

#### Scenario: A menu that only leads somewhere still opens

- **WHEN** the heading names a registered command and the menu has no other entry
- **THEN** the menu opens with the heading as its only entry

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
