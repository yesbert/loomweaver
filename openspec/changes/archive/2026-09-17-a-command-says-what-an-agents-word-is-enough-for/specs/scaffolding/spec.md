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

Where the generated output treats a command as consequential, it SHALL take that from what the
command itself states about an agent's word, read off the command the call names, rather than from a
list of command identities kept beside the commands. A list beside them is what the generated output
must not teach: it drifts from the commands it describes, and it cannot speak for a command another
plugin registered.

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

- **WHEN** the generated output's command states that the person is asked first and an agent calls it
- **THEN** the user is asked first
- **AND** declining stops the command from running

#### Scenario: The generated decision reads the command, not a list

- **WHEN** a weaver is generated with an agent connection
- **THEN** the generated decision asks the command the call names what an agent's word is enough for
- **AND** the generated output holds no list of consequential command identities

#### Scenario: What is offered is asked for again each run

- **WHEN** what is reachable changes between two runs
- **THEN** the second run offers the changed list rather than the earlier one

### Requirement: A consumer can have their own declarations checked

The platform SHALL offer checks for the declarations a consumer writes by hand: that a plugin
manifest is well formed, that a catalogue is usable, that translation bundles cover the same
keys, and that a command registration says what an agent needs to be offered it and to call it
well. A finding SHALL name the consequence rather than only the rule, because the workbench reads
these defensively and an unusable value disappears without a word.

A check SHALL be able to distinguish something it can judge from something it cannot, and say which.

For command registrations, the check SHALL report each command it finds with one of three outcomes:
offered to an agent; offered but described in a way that leaves the agent guessing, naming the
argument or the answer that lacks a description; or not offered, naming what closes it. Where a
command is offered, the report SHALL also say what the command states about an agent's word being
enough to run it, and say that it states nothing where it states nothing. Because a command's reach
is finally decided at runtime by grants and access, the check SHALL say that it judged the
registration alone. A strict mode SHALL fail on a command that is offered without a
description; it SHALL report an argument without a description and a returned value without a
declared answer without failing on them; and it SHALL NOT fail on a command that is simply not
offered, because closed is the default the platform intends. It SHALL NOT fail on, nor warn about, a
command that states nothing about an agent's word, and SHALL NOT guess from a command's identity or
its label what running it would cost: saying nothing is a declaration the platform accepts, and a
guess a consumer cannot act on teaches them to overlook the report.

#### Scenario: A finding says what it will cost

- **WHEN** a catalogue names a permission the platform does not define
- **THEN** the finding says that the workbench will drop it silently and what follows from that

#### Scenario: A missing translation key is found before a user meets it

- **WHEN** one language bundle lacks a key another has
- **THEN** the check reports it

#### Scenario: What cannot be judged is reported as such

- **WHEN** a value can only be judged in the browser
- **THEN** it is reported as a warning rather than passed or failed

#### Scenario: A command an agent is never offered is named

- **WHEN** a plugin's sources register a command that is not opened to callers other than its own
  plugin
- **THEN** the check lists it as not offered and says that an agent never sees it

#### Scenario: A command an agent would have to guess at is named

- **WHEN** a registered command is opened to other callers but lacks a description, or declares an
  argument without a description, or returns a value without declaring an answer
- **THEN** the check names the command and the missing piece and says what the agent sees instead

#### Scenario: What a command says about an agent's word is reported

- **WHEN** a registered command is opened to other callers and states that the person is asked every
  time
- **THEN** the report says so for that command

#### Scenario: Saying nothing is reported as saying nothing, and fails nothing

- **WHEN** the check runs in strict mode over a plugin with one described callable command that
  states nothing about an agent's word
- **THEN** the report says that the command states nothing
- **AND** the check does not fail and does not warn on that account

#### Scenario: Strict mode gates what closes a command, not what merely narrows it

- **WHEN** the check runs in strict mode over a plugin with one callable command without a
  description and one command that is not callable
- **THEN** it fails because of the first
- **AND** it does not fail because of the second

#### Scenario: The check names the limit of what it read

- **WHEN** the check reports on a directory
- **THEN** its report says that grants and access decide the rest at runtime and were not judged
