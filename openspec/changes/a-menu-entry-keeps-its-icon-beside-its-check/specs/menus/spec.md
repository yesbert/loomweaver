## ADDED Requirements

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
