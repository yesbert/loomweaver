## ADDED Requirements

### Requirement: A rail may show the names of its entries, and each rail is decided on its own

A rail SHALL be able to show each entry's name alongside its icon, and the user SHALL decide whether
it does. The decision SHALL be offered once per rail the frame declares, each offer carrying that
rail's own name, and SHALL start switched off. It SHALL survive a restart.

Where an entry's name is on screen, the workbench SHALL NOT repeat it as a tooltip. The limit of
that: a name the rail cannot show in full SHALL be shortened, and for a shortened name the tooltip
SHALL remain, because an entry the user cannot read is not identifiable by the name it was given.

#### Scenario: The user turns names on for one side only

- **WHEN** the frame declares a rail on each side and the user turns names on for one of them
- **THEN** the entries of that rail show their names
- **AND** the entries of the other rail do not

#### Scenario: A side that was never declared is not offered

- **WHEN** the frame declares a rail on one side only
- **THEN** exactly one decision is offered, under that rail's name

#### Scenario: The decision outlives the session

- **WHEN** the user turns names on and the application is started again
- **THEN** the names are still shown

#### Scenario: A name on screen is not also a tooltip

- **WHEN** an entry shows its name and the pointer rests on it
- **THEN** no tooltip repeats that name

#### Scenario: A name too long to show stays reachable

- **WHEN** an entry's name is longer than the rail can show
- **THEN** the name is shortened in place
- **AND** the full name is still available as a tooltip

### Requirement: A rail is named for its side only when there is another side

A rail SHALL carry one name, and everything the workbench says about that rail SHALL use it: the
name assistive technology announces for the region, and the name of any offer the workbench makes
about it. Where the frame declares more than one rail, that name SHALL say which side the rail is
on. Where it declares one, the name SHALL NOT, because there is no second rail to tell it apart
from.

#### Scenario: Two rails are told apart by their names

- **WHEN** the frame declares a rail on each side
- **THEN** the two names differ, and each says which side its rail is on

#### Scenario: A lone rail is not named for a side

- **WHEN** the frame declares one rail
- **THEN** its name says no side

#### Scenario: One name, wherever the rail is spoken of

- **WHEN** a rail is announced as a region and offered in the settings
- **THEN** both use the same name

### Requirement: A rail that holds more than fits scrolls, and its anchored band stays

Where a rail holds more entries than its height admits, the rail SHALL scroll, and every entry SHALL
be reachable without the user resizing the window. Entries SHALL NOT be clipped away unreachably.

The band anchored to the bottom SHALL stay in view while the entries above it scroll, so that what a
user reaches for last does not travel with what they are scrolling past.

#### Scenario: The last entry is reachable

- **WHEN** a rail holds more entries than its height admits
- **THEN** the entries above the anchored band can be scrolled
- **AND** the last of them can be brought into view

#### Scenario: The anchored band does not scroll away

- **WHEN** the entries of an overflowing rail are scrolled
- **THEN** the entries anchored to the bottom stay in view

#### Scenario: Keyboard focus brings its entry into view

- **WHEN** the keyboard moves focus to an entry that is scrolled out of view
- **THEN** that entry is brought into view

#### Scenario: A rail that fits is unchanged

- **WHEN** every entry of a rail fits its height
- **THEN** the rail looks and behaves as it did before
