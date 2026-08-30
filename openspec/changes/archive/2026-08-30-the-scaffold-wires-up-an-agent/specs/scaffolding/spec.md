## ADDED Requirements

### Requirement: A weaver can be generated ready for an agent to drive it

A weaver SHALL be generatable with the connection that lets an agent speaking the AG-UI protocol run
the workbench's commands. What is generated SHALL work on the first run, before any agent exists: it
SHALL come with a local stand-in producing the protocol's own events, so that serving the generated
product and nothing else exercises the whole path from the offered list through a call to its outcome.

Where the weaver would otherwise carry no command an agent could reach, generating the connection
SHALL also generate one, because a connection that offers nothing demonstrates nothing.

The stand-in SHALL say that it is one, where the person using it cannot miss it, and SHALL be confined
to the one place meant to be replaced, so that putting a real connection in its place leaves the rest
of the generated output standing. Nothing SHALL be generated for the connection itself: no transport,
no credential and no language model, because those are the product's own and cannot be guessed.

The generated connection SHALL carry the seam where a product decides about a call before it runs, and
SHALL declare the permission that reaching commands beyond the weaver's own requires, rather than
leaving the consumer to add it.

#### Scenario: A generated weaver demonstrates the path with no backend

- **WHEN** a weaver is generated with an agent connection and served without further edits
- **THEN** a command can be run from the generated output and its outcome is shown
- **AND** nothing is sent anywhere

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

## MODIFIED Requirements

### Requirement: Generated output builds, passes its own checks, and needs no repair

What a generator produces SHALL compile against the published contract and SHALL pass the checks the
platform's own conventions impose, including its own naming and its own style rules. It SHALL NOT
require a consumer to fix it before it works.

Producing sources alone does not satisfy this. Where generated output needs configuration elsewhere in
the workspace before it runs, a generator with access to that workspace SHALL produce that
configuration too. A build that reports success while the generated product does not work SHALL be
treated as the same defect as a build that fails, because it hides rather than reports.

Where generated output needs a package the consumer's project does not already carry, that need SHALL
be met rather than assumed. A route that can reach the workspace SHALL record the dependency there; a
route that cannot SHALL name it among the steps that remain. Output naming a package nobody installs
does not compile, which is the same defect as output that does not build.

This holds for the generated product as it is served, not only as it is compiled: the workbench's
chrome SHALL render with its own styles applied and its own strings resolved, and nothing the
generator itself put in place SHALL contradict anything else it put in place.

#### Scenario: A generated project passes its own lint

- **WHEN** a project is generated with a non-default naming prefix
- **THEN** it passes the very lint rules the generator itself emitted

#### Scenario: A generated project has something to test

- **WHEN** a project is generated in a workspace that runs unit tests
- **THEN** it is wired for tests and has a starter test to run

#### Scenario: A workspace that tests differently gets no test wiring

- **WHEN** a project is generated in a workspace that runs no unit tests
- **THEN** no test wiring and no starter test are emitted

#### Scenario: A generated distribution runs without further wiring

- **WHEN** a distribution is generated into an application workspace and served without further edits
- **THEN** the workbench chrome renders laid out and styled
- **AND** its own strings resolve rather than showing their keys
- **AND** nothing it registers for itself fails to load

#### Scenario: The styles the chrome relies on are actually produced

- **WHEN** generated output relies on a style pipeline to produce the classes the workbench's
  templates use
- **THEN** the generator produces that pipeline's configuration as well as the stylesheet that needs
  it
- **AND** the served styles contain those classes

#### Scenario: What the generator emits does not contradict itself

- **WHEN** generated output is built for release
- **THEN** the restrictions the generator placed on the generated document permit everything the
  build settings it generated will do
- **AND** the result is styled, as the development build is

#### Scenario: A generated stylesheet carries no directive its build will not consume

- **WHEN** a generated stylesheet is served
- **THEN** it contains no build-time directive left unprocessed

#### Scenario: A package the generated output needs is installed where that is possible

- **WHEN** generated output needs a package the consumer's project does not carry, and the route can
  reach the workspace
- **THEN** the dependency is recorded there rather than left to the consumer

#### Scenario: A route that cannot install names the package instead

- **WHEN** the same output is produced by a route that cannot reach the workspace
- **THEN** the package is named among the steps that remain, together with what fails if it is skipped

