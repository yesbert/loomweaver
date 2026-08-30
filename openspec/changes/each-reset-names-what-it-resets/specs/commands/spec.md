## ADDED Requirements

### Requirement: Two commands a user can reach are told apart by their names

Where the workbench offers more than one command in the same list, no two of the commands it ships
SHALL present the same name in any language it ships. A name SHALL say what its own command does, so
that two commands whose effects differ do not differ only by a word one of them leaves out.

One command SHALL present one name. Where the same command is reached from more than one control,
every control SHALL label it alike, because a second label for one command cannot be told, by the
person reading it, from a second command.

The limit of this guarantee: it holds for the commands the workbench itself registers and for the
languages it ships. A product that registers its own commands, or rewords the shipped ones, owns
whatever collision it creates, and the workbench does not police it at runtime.

#### Scenario: Two commands that reset different things say which they reset

- **WHEN** the workbench offers a command that resets the application's own arrangement and a command
  that resets the active workspace
- **THEN** each name says which of the two it resets
- **AND** neither carries a name the other could equally have

#### Scenario: One command is labelled the same wherever it is offered

- **WHEN** the same command is reachable from a settings control and from the command search
- **THEN** both present the same name

#### Scenario: A collision is caught before it ships

- **WHEN** two of the shipped commands would present the same name in a shipped language
- **THEN** that is a defect the repository's own checks report, rather than something a user
  discovers by running the wrong one
