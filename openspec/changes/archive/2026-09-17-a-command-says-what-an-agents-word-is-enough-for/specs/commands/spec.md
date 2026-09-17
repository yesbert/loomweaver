## ADDED Requirements

### Requirement: A command may say what an agent's word is enough for

A command SHALL be able to state what running it on an agent's word alone amounts to, as one of four
statements: that the agent's word is enough; that the person is asked first; that the person is asked
every time it is called; or that it is not to be run on an agent's word at all. A command that states
nothing states nothing, which is the default and means what the platform does today.

The statement SHALL travel with the command wherever the workbench accounts for it to something other
than the person at the keyboard: a caller that enumerates the commands it may invoke SHALL read it
there, and a description of a command written for an agent choosing between actions SHALL carry it
beside what the command does, what it takes and what it answers.

**The platform states this and does not enforce it**, exactly as a command's access requirement is a
statement about presentation rather than protection. Nothing is asked on the product's behalf, no
answer is remembered, and no invocation is refused on this account: a command that says the person is
asked first still runs when invoked, whoever invoked it. Asking, and remembering an answer, belong to
whoever runs commands on an agent's behalf, because only a product knows how it talks to its users. A
command that must be beyond an agent's reach is put there by not opening it to foreign callers at
all, which the platform does enforce.

The statement SHALL NOT widen anything. A command that opens itself to foreign callers and states
that the agent's word is enough is reachable exactly where it was reachable before.

#### Scenario: What a command says is read back where a caller enumerates commands

- **WHEN** a caller lists the commands it may invoke and one of them states what an agent's word is
  enough for
- **THEN** the listed entry carries that statement

#### Scenario: A command that says nothing carries nothing

- **WHEN** a caller lists a command that states nothing about an agent's word
- **THEN** the entry carries no such statement, and the command is offered as it is today

#### Scenario: A description written for an agent carries the statement

- **WHEN** a command that states something about an agent's word is described for an agent to choose
  from
- **THEN** the description carries that statement beside what the command does

#### Scenario: The statement refuses nothing by itself

- **WHEN** a command stating that the person is asked every time is invoked by identity, with nobody
  asked
- **THEN** it runs, because the statement is not a gate

#### Scenario: Out of reach is still expressed by not opening the command

- **WHEN** a command states that it is not to be run on an agent's word and is open to foreign
  callers
- **THEN** it is still listed and still runs when invoked, and closing it to foreign callers is what
  puts it out of reach
