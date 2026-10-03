## ADDED Requirements

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

Activating an entry SHALL be the command invocation the surface already has, with the description as
the command's context, so that the refusal and failure rules of that invocation apply unchanged. An
entry the surface was told about SHALL run when invoked that way, and the surface SHALL need no
grant beyond what the invocation already requires: an entry contributed by its own plugin runs on
that account, and an entry naming another plugin's command runs only where that command is open to
a foreign caller and the surface's plugin holds the capability to reach it. The answer SHALL omit an
entry the invocation would refuse, so that the surface never draws a control it cannot run.

The surface SHALL be able to stop asking, and a surface that is torn down SHALL be told nothing
further.

#### Scenario: A sandboxed surface draws a toolbar from what it is told

- **WHEN** an isolated surface asks what a slot offers against a description, and a plugin in the
  page has contributed an entry matching that description
- **THEN** the surface is told the entry with its title, icon and shortcut, draws it, and invoking it
  runs the command with the description

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

#### Scenario: An entry the surface could not run is not in the answer

- **WHEN** an entry names another plugin's command that has not declared itself open to a foreign
  caller, or the surface's plugin lacks the capability to reach foreign commands
- **THEN** the surface is not told the entry

#### Scenario: A torn-down surface is told nothing

- **WHEN** an isolated surface that was listening is torn down and an entry is then contributed
- **THEN** nothing is sent to it
