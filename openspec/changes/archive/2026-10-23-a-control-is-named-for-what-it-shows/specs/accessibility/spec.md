## MODIFIED Requirements

### Requirement: The workbench meets WCAG 2.1 Level AA

The chrome the workbench draws SHALL conform to WCAG 2.1 Level AA. Conformance SHALL be checked
by an automated audit over the workbench's principal screens and states, which runs as part of the
end-to-end suite.

A control the workbench draws SHALL carry in its accessible name every word it shows, in the order it
shows them, and the shortcut it shows. Where the control shows words that are not its purpose, such
as a person's initials, a person's name or the active view, its name SHALL begin with those words and
name the purpose after them. A shortcut it shows SHALL follow the purpose, as it does in a menu row,
and the control SHALL announce it as its keyboard shortcut. This holds for an entry a distribution
declares as data and the workbench draws: where such an entry has a visible label and a tooltip, its
name SHALL begin with the label even though the tooltip says something else.

The limit: a component a distribution draws itself, in a bar or anywhere else, is named by the
distribution. The workbench neither reads nor corrects it.

#### Scenario: The principal screens pass an automated audit

- **WHEN** the automated accessibility audit runs over the workbench's principal screens in both
  light and dark appearance, and with a dialog, a menu and a populated tab strip open
- **THEN** no violation at level A or AA is reported, including the check that a control's name
  contains the text it shows

#### Scenario: The audit's own limits are not mistaken for coverage

- **WHEN** the automated audit passes
- **THEN** that establishes only what a machine can check — names, contrast, roles and relationships
- **AND** focus order, keyboard reach and screen-reader sense remain to be checked by a person

#### Scenario: An entry drawn with initials is named by them first

- **WHEN** a rail entry or a declared bar button is drawn with the initials "NR" and is titled "Account"
- **THEN** its accessible name is "NR, Account"

#### Scenario: An entry that shows its shortcut says it in its name

- **WHEN** the command palette entry is drawn with the hint ⌘K on a Mac
- **THEN** its accessible name is its purpose followed by ⌘K
- **AND** it announces the platform's command key with K as its keyboard shortcut

#### Scenario: A control that shows what is chosen is named by it first

- **WHEN** the view switcher shows the active view "Default"
- **THEN** its accessible name begins with "Default" and names the switcher after it

#### Scenario: A menu heading that leads somewhere is named by what it shows

- **WHEN** a menu's heading shows a person's initials, name and address and leads to the command
  "Profile"
- **THEN** its accessible name carries the initials, the name and the address in that order and ends
  with "Profile"

#### Scenario: A badge stays a word of its own

- **WHEN** a content tab titled "Export" carries the badge "New"
- **THEN** the text the tab shows reads as the two words "Export" and "New"
- **AND** its accessible name contains both, in that order

#### Scenario: A tooltip does not replace a visible label

- **WHEN** a distribution declares a bar button with the label "EN" and the tooltip "Language"
- **THEN** the button's accessible name begins with "EN" and contains "Language"
