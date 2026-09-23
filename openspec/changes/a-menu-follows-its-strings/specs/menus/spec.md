## ADDED Requirements

### Requirement: An open menu follows its strings

The workbench paints before the translations have arrived, so a menu can be opened while its words
are not there yet. Every menu the workbench draws SHALL therefore be worded again, in place and
without closing, when a translation bundle arrives and when the language changes while it is open:
a declared menu, a menu opened from a control, the heading of either, and a menu a plugin opens
against its own content. The entry that has the focus SHALL keep it.

The entries of a menu a plugin opens against its own content SHALL take a translation key or a
literal, like every other piece of chrome text that takes either, and SHALL be told apart the same
way. A key follows the strings; a literal is shown as it is.

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
