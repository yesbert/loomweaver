## ADDED Requirements

### Requirement: A surface's action may be replaced while the surface is mounted

A plugin SHALL be able to replace one action of a surface it registered, naming the surface and the
action by the ids it registered them under, without registering the surface again. Everywhere the
workbench draws that surface's actions SHALL follow, the header of the panel it is docked in first
among them. The surface itself SHALL NOT be rebuilt, so what the user has typed, scrolled or folded
inside it survives. An action id the surface did not carry SHALL be added to its actions, in the
place its order gives it.

The limit of that: a replacement reaches the one action named. The surface's other actions, its
name and everything else its declaration carries are unaffected, and a replacement on a surface id
nothing was registered under changes nothing. This is held on the in-process runtime and verified
on the panel header; a sandboxed surface carries no actions, so there is nothing on it for this to
replace.

#### Scenario: The header draws the replaced action

- **WHEN** a plugin replaces an action of a surface docked in a panel with one carrying a different
  title and icon
- **THEN** the panel header shows the new title and icon for that action

#### Scenario: The surface keeps what the user did in it

- **WHEN** an action is replaced while the user has state inside the surface
- **THEN** the surface is not rebuilt and that state is still there

#### Scenario: An action the surface did not carry is added

- **WHEN** a plugin replaces an action under an id the surface's actions did not include
- **THEN** the surface's actions gain it, ordered as its order says

#### Scenario: Replacing on a surface that was never registered does nothing

- **WHEN** a plugin replaces an action on a surface id it did not register
- **THEN** nothing changes and nothing is drawn differently

### Requirement: A toggling action carries its state

An action MAY declare that it is a toggle and whether it currently stands on or off. Where the
workbench draws such an action it SHALL show that state, visibly and to assistive technology as a
pressed state, so that a screen reader announces the action as a toggle with its current state. An
action that declares no such state SHALL be drawn and announced as a plain button, as before.

#### Scenario: A pressed action is announced as pressed

- **WHEN** a surface's action declares it stands on
- **THEN** the control drawn for it reports a pressed state to assistive technology and looks
  pressed

#### Scenario: A released action is announced as a toggle that is off

- **WHEN** a surface's action declares it stands off
- **THEN** the control drawn for it reports an unpressed state, so that it is still known to be a
  toggle

#### Scenario: An action without a state is a plain button

- **WHEN** a surface's action declares no toggle state
- **THEN** the control drawn for it reports no pressed state at all

#### Scenario: A toggle changes state by being replaced

- **WHEN** a plugin replaces a toggling action with the same id and the opposite state
- **THEN** the control drawn for it reports the new state without the surface being rebuilt
