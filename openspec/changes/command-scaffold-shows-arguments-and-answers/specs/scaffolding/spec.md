## MODIFIED Requirements

### Requirement: A weaver can be generated ready for an agent to drive it

A weaver SHALL be generatable with the connection that lets an agent speaking the AG-UI protocol run
the workbench's commands. What is generated SHALL work on the first run, before any agent exists: it
SHALL come with a local stand-in producing the protocol's own events, so that serving the generated
product and nothing else exercises the whole path from the offered list through a call to its outcome.

Where the weaver would otherwise carry no command an agent could reach, generating the connection
SHALL also generate one, because a connection that offers nothing demonstrates nothing. The command
that is generated SHALL be the complete example rather than the smallest one: it SHALL declare at
least one argument with a description written for something choosing a value, and SHALL declare
what it answers with and answer accordingly, so that the generated path demonstrates arguments
arriving and an answer returning, not only a call.

The stand-in SHALL say that it is one, where the person using it cannot miss it, and SHALL be confined
to the one place meant to be replaced, so that putting a real connection in its place leaves the rest
of the generated output standing. Nothing SHALL be generated for the connection itself: no transport,
no credential and no language model, because those are the product's own and cannot be guessed. The
stand-in SHALL fill the generated command's argument from what the command declared, rather than
sending none.

The generated connection SHALL carry the seam where a product decides about a call before it runs, and
SHALL declare the permission that reaching commands beyond the weaver's own requires, rather than
leaving the consumer to add it.

#### Scenario: A generated weaver demonstrates the path with no backend

- **WHEN** a weaver is generated with an agent connection and served without further edits
- **THEN** a command can be run from the generated output and its outcome is shown
- **AND** nothing is sent anywhere

#### Scenario: The generated command shows arguments and an answer

- **WHEN** a weaver is generated with an agent connection and the generated command is run from the
  generated output
- **THEN** the call carries an argument value the stand-in took from the command's own declaration
- **AND** the outcome shown is the command's declared answer, not an empty success

#### Scenario: The part that is not an agent says so

- **WHEN** the generated stand-in is used
- **THEN** it states that it is a stand-in rather than an agent

#### Scenario: Replacing the stand-in leaves the rest standing

- **WHEN** the stand-in is replaced by a connection to a real agent
- **THEN** nothing else in the generated output has to change

#### Scenario: The connection itself is not guessed at

- **WHEN** output is generated with an agent connection
- **THEN** it carries no transport, no credential and no language model

#### Scenario: The permission comes with the choice

- **WHEN** a weaver is generated with an agent connection
- **THEN** it declares the permission that reaching commands beyond its own requires

#### Scenario: A consequential call is stopped by declining it

- **WHEN** the generated output names a command as consequential and an agent calls it
- **THEN** the user is asked first
- **AND** declining stops the command from running

#### Scenario: What is offered is asked for again each run

- **WHEN** what is reachable changes between two runs
- **THEN** the second run offers the changed list rather than the earlier one
