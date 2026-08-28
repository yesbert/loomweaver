## ADDED Requirements

### Requirement: A generated distribution shows the way into its searches

A generated distribution SHALL present, on its first run and without the consumer editing anything,
a visible entry point to the command search and a visible entry point to the search over open work,
each naming the shortcut that also opens it. The two SHALL be placed apart from one another, so that
neither is read as a duplicate of the other.

This holds for what the generator emits, not for what the workbench requires: both entry points
remain the consumer's to move or delete, and a distribution that emits neither is still a valid one.

The notes a generator writes beside the generated product SHALL name both shortcuts and SHALL say
how to move an entry point to another bar, how to remove an entry point while keeping its search,
how to remove a search entirely, and how to bind one of the two shortcuts to a command of the
consumer's own. Where binding a shortcut has a way that resolves by registration order rather than
by intent, the notes SHALL name it as the way not to do it.

#### Scenario: A generated distribution offers both searches visibly

- **WHEN** a distribution is generated and served without further edits
- **THEN** the chrome shows an entry point to the command search and an entry point to the search
  over open work, each naming its shortcut

#### Scenario: The two entry points are not placed together

- **WHEN** a generated distribution renders its chrome
- **THEN** the two entry points sit in different bars

#### Scenario: The generated notes say how to take them away again

- **WHEN** a consumer reads the notes the generator wrote beside the generated product
- **THEN** they are told how to move each entry point, how to remove it while keeping its search,
  how to remove the search itself, and how to bind its shortcut to a command of their own
