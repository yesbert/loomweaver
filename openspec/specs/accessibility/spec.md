# accessibility Specification

## Purpose
Accessibility is a property of the workbench rather than of each plugin, because the workbench draws
almost all of the chrome. A plugin that contributes declaratively and uses the host's own building
blocks therefore inherits the guarantee, and this capability states what exactly it inherits.

## Requirements

### Requirement: The workbench meets WCAG 2.1 Level AA

The chrome the workbench draws SHALL conform to WCAG 2.1 Level AA. Conformance SHALL be checked
by an automated audit over the workbench's principal screens and states, which runs as part of the
end-to-end suite.

#### Scenario: The principal screens pass an automated audit

- **WHEN** the automated accessibility audit runs over the workbench's principal screens in both
  light and dark appearance, and with a dialog, a menu and a populated tab strip open
- **THEN** no violation at level A or AA is reported

#### Scenario: The audit's own limits are not mistaken for coverage

- **WHEN** the automated audit passes
- **THEN** that establishes only what a machine can check — names, contrast, roles and relationships
- **AND** focus order, keyboard reach and screen-reader sense remain to be checked by a person

### Requirement: Every colour pairing the workbench ships meets the contrast bar

The semantic colour tokens SHALL be defined so that any pairing the workbench uses meets the AA
contrast ratio, in both light and dark appearance. Where a brand colour cannot meet it, the
workbench SHALL carry separate tokens for the readable variants rather than lowering the bar.

#### Scenario: Brand identity does not force an unreadable pairing

- **WHEN** a brand colour is too light to carry text at the required ratio
- **THEN** the workbench uses a separate token for text and for filled surfaces
- **AND** the brand colour itself is still used where contrast does not apply

### Requirement: Everything reachable by pointer is reachable by keyboard

Every gesture the workbench offers SHALL have a keyboard route. Where a gesture is a drag, the
keyboard equivalent SHALL exist and SHALL announce its result, so that a user who cannot drag is not
excluded from arranging their work.

#### Scenario: Rearranging is possible without a pointer

- **WHEN** a user moves a tab, a docked view or a launcher item using the keyboard
- **THEN** the move happens
- **AND** the result is announced to assistive technology

#### Scenario: Closing and promoting a tab is possible without a pointer

- **WHEN** a tab has keyboard focus
- **THEN** it can be closed from the keyboard
- **AND** the key that does so is announced on the tab itself

### Requirement: The workbench's structure is announced, not just drawn

The workbench SHALL expose its regions as landmarks, its tab strips as real tab lists, and its
transient messages as live regions, so that the structure a sighted user sees is available to a
screen reader. Where two regions are of the same kind, each SHALL be distinguishable by name.

#### Scenario: Two sidebars are told apart

- **WHEN** the workbench draws a panel on each side
- **THEN** each carries its own accessible name

#### Scenario: A transient message is announced

- **WHEN** the workbench raises a notice
- **THEN** it is announced, with urgency matching the kind of notice

### Requirement: A surface that opens in more than one mode is named for the mode it is in

Where the workbench opens one surface in more than one mode, the accessible name it presents SHALL
describe the mode it opened in, so that what a screen reader announces is what actually opened. This
holds for the container and for the control that receives focus inside it: neither SHALL be left
unnamed, and neither SHALL carry the name of a mode other than the current one.

A placeholder SHALL NOT be relied on to carry this distinction. It is announced inconsistently
across screen readers and it disappears as soon as the user types, so it cannot be the only thing
that says which of two searches is open.

The limit of this guarantee: it is not established by the automated audit, which reports a control
named for the wrong thing as correctly named. It SHALL therefore rest on a test that asserts the
name against the mode.

#### Scenario: The search over open work announces itself as that

- **WHEN** the user opens the search over open work
- **THEN** the name it presents describes searching open work, and not searching commands

#### Scenario: The command search still announces itself as that

- **WHEN** the user opens the command search
- **THEN** the name it presents describes searching commands

#### Scenario: The distinction does not rest on the placeholder

- **WHEN** the user has typed into either search, so that no placeholder is shown
- **THEN** the name still describes the mode that is open

### Requirement: A tab strip stays a valid tab list

Because a tab is announced as a tab, it cannot contain another focusable control. Affordances drawn
inside a tab — closing it, unpinning it — SHALL therefore not be focusable, and their function
SHALL be reachable from the keyboard by another route.

#### Scenario: The close affordance is not a second focus stop

- **WHEN** a user moves focus through a populated tab strip
- **THEN** focus lands on each tab and not on the affordances drawn inside them

### Requirement: Focus is visible, trapped where it must be, and given back

Focus SHALL be visibly indicated wherever it goes. A modal surface SHALL keep focus within itself
while it is open and SHALL return focus where it came from when it closes.

#### Scenario: A dialog does not leak focus

- **WHEN** a modal dialog is open and the user moves focus forward past its last control
- **THEN** focus stays within the dialog

#### Scenario: Closing a dialog restores focus

- **WHEN** a modal dialog closes
- **THEN** focus returns to what had it before

### Requirement: The user may enlarge text, and motion may be reduced

The workbench SHALL offer a text-size setting that scales the interface relative to the browser's
own base size rather than overriding it, and SHALL honour a system preference for reduced motion by
dropping non-essential animation.

#### Scenario: Enlarging text does not fight the browser's own setting

- **WHEN** the user enlarges text in the workbench
- **THEN** the interface scales relative to the browser's base size

#### Scenario: Reduced motion is respected

- **WHEN** the system asks for reduced motion
- **THEN** non-essential transitions and animations do not play

### Requirement: What a plugin inherits, and what it does not

A plugin that contributes declaratively or uses the workbench's own building blocks SHALL inherit
these guarantees. A plugin that draws its own interior SHALL be responsible for it, and the
workbench SHALL make the inherited path the easy one by offering named building blocks with the
guarantees already in them.

#### Scenario: A declarative contribution is accessible without effort

- **WHEN** a plugin contributes an item, a command or a settings row declaratively
- **THEN** the workbench draws it with the name, role and contrast the guarantee requires

#### Scenario: An isolated surface is on its own inside its frame

- **WHEN** a plugin draws its own interior
- **THEN** the workbench guarantees the chrome around it and not the content within it
