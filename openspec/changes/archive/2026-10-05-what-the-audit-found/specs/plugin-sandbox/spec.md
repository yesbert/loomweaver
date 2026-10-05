## MODIFIED Requirements

### Requirement: An isolated surface may ask what a slot offers, and draw it itself

An isolated surface SHALL be able to ask the workbench what a menu slot offers against a description
it supplies, and SHALL be told reactively: the answer SHALL follow the registered entries, the
registered commands, the session and the translations, so that the surface redraws when any of them
changes, without asking again. The surface draws the toolbar or menu itself with the elements the
workbench already serves to it; the workbench SHALL NOT draw into the surface.

The answer SHALL be data and nothing but data: for each entry its identity, its title as worded for
the language in effect, its icon, its shortcut as spelled for the platform, its group and order,
whether it represents a state and whether that state is on, and whether activating it opens a
further slot. The answer SHALL already be narrowed by every rule that would refuse the entry — the
command's access requirement, the window the surface is in, and the entry's own matching against
the description — so that everything the surface is told it may draw, and nothing it is not told
exists for it. A cell a plugin in the page draws itself SHALL NOT be in the answer.

The description the surface supplies SHALL be validated as data at the boundary, and a description
that is not SHALL be refused rather than matched.

Activating an entry SHALL be reported to the workbench, which runs the entry as it runs the same
entry in a toolbar drawn in the page: through the one place every trigger runs through, with the
description as the command's context. The answer is what a toolbar in the page would draw for that
slot and description, no more and no less: an entry the workbench would refuse to run is not in it,
and an entry another plugin contributed is in it whether or not the surface's plugin may invoke that
plugin's commands itself, because activating a drawn control is the user's act, not the plugin's. An
entry SHALL run only under the subscription it was told in, so that a surface cannot name an entry
it was never shown.

An entry whose activation opens a further slot SHALL NOT be answered with that slot's identity.
The surface SHALL report that it opened the entry, under the subscription that showed it, and SHALL
be answered with the menu the page opens for the same entry: matched against the description the
entry was shown against, narrowed by the same rules as a menu in the page, so that an entry with
nothing to label it is not in it, and carrying the heading the entry declares, worded for the
language in effect. Activating an entry of that menu, or a heading that leads somewhere, SHALL run
it as the page runs it. Asking to open an entry that opens nothing SHALL be refused.

The surface SHALL be able to stop asking, and a surface that is torn down SHALL be told nothing
further.

#### Scenario: A sandboxed surface draws a toolbar from what it is told

- **WHEN** an isolated surface asks what a slot offers against a description, and a plugin in the
  page has contributed an entry matching that description
- **THEN** the surface is told the entry with its title, icon and shortcut, draws it, and reporting
  its activation runs the command with the description

#### Scenario: An isolated plugin may own a toolbar slot

- **WHEN** an isolated plugin registers a toolbar through its channel
- **THEN** the slot is declared, a plugin in the page may fill it, and the plugin's own surface draws
  it from what it is told

#### Scenario: The answer follows the session

- **WHEN** the session comes to qualify for a command an entry names while the surface is listening
- **THEN** the surface is told the entry without asking again, and is told it is gone when the
  session no longer qualifies

#### Scenario: The answer follows the words

- **WHEN** the language changes while the surface is listening
- **THEN** the surface is told the entries worded in the new language

#### Scenario: A description that is not data is refused

- **WHEN** an isolated surface supplies a description carrying something that cannot be carried as
  data
- **THEN** the request is refused, and nothing is matched against it

#### Scenario: A cell is not in the answer

- **WHEN** a plugin in the page has registered a cell against the slot
- **THEN** the surface is told the slot's declarative entries and nothing of the cell

#### Scenario: The answer is what the page would draw

- **WHEN** another plugin has contributed an entry naming a command of its own, and the surface's
  plugin holds no capability to invoke foreign commands
- **THEN** the surface is told the entry, and activating it runs the command with the description,
  exactly as the same entry runs in a toolbar drawn in the page

#### Scenario: An entry runs only under the subscription that showed it

- **WHEN** a surface activates a key under a subscription whose answer never held that key
- **THEN** nothing runs

#### Scenario: A torn-down surface is told nothing

- **WHEN** an isolated surface that was listening is torn down and an entry is then contributed
- **THEN** nothing is sent to it

#### Scenario: A menu opened in the surface is the menu the page opens

- **WHEN** an isolated surface opens an entry that opens a further slot, and that slot holds an entry
  matching the opening entry's description and an entry matching only its own identity
- **THEN** the surface is told the first and not the second, as a menu opened from the same entry in
  the page would show

#### Scenario: The heading crosses with the menu

- **WHEN** the entry an isolated surface opens declares a heading for its menu
- **THEN** the surface is told the heading, worded, with the menu's entries

#### Scenario: Only an entry that opens something can be opened

- **WHEN** an isolated surface asks to open an entry that opens no further slot, or one it was never
  shown
- **THEN** nothing is answered and nothing runs
