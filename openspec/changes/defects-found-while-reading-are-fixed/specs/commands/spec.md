## MODIFIED Requirements

### Requirement: Open work is searchable in its own mode

The workbench SHALL offer a second search over open work, distinct from the command search and
reached by its own gesture. It SHALL list what is open, most recently active first, and choosing one
SHALL reveal it where it is. It SHALL offer the actions of a piece of open work without leaving the
search.

#### Scenario: The two searches do not mix

- **WHEN** the user opens the command search
- **THEN** it lists commands and not open work

#### Scenario: Open work is listed by recency

- **WHEN** the user opens the search over open work
- **THEN** the most recently active is first

#### Scenario: Actions are reachable without leaving

- **WHEN** the user asks for the actions of a highlighted piece of open work
- **THEN** its menu opens at that row

#### Scenario: An action chosen in the search acts where the work stands

- **WHEN** the user opens the actions of open work held by a pane that does not carry the address,
  and chooses to close it, to pin it or to close what lies to its right
- **THEN** that happens in the pane that holds it, as from that pane's own tab menu
- **AND** the tabs of the address-carrying pane are untouched, and closing the work runs its owner's
  teardown once

### Requirement: A command may take described arguments and give an answer

A command MAY declare the arguments it accepts and MAY answer with a result. What it declares SHALL
be discoverable without running it: each argument SHALL carry a name, the kind of value it takes,
whether it is required, and a description of what it means.

Both the arguments and the answer SHALL be plain data, because they cross the boundary between a
plugin and the workbench unchanged. A value that cannot be carried as data SHALL be refused rather
than arriving stripped of what it was.

A command that declares no arguments SHALL keep working exactly as it does today, invoked with none.

An argument MAY offer a set of choices, and a value outside them SHALL be refused before the command
runs. For a command registered by a plugin running in the page, the choices SHALL be read each time
the command is described or its arguments are checked, so that a choice which exists only after the
command was registered is offered and accepted. A command registered by an isolated plugin SHALL
carry the choices it declared when it registered, because its declaration crosses the boundary once;
it offers new choices by registering the command again.

#### Scenario: What a command takes is discoverable before it runs

- **WHEN** a caller asks what a command accepts
- **THEN** it is told each argument's name, the kind of value it takes, whether it is required, and
  what it means, without the command running

#### Scenario: A command that declares nothing is unaffected

- **WHEN** a command that declares no arguments is triggered
- **THEN** it runs as it did before, with no arguments

#### Scenario: A missing required argument is refused

- **WHEN** a command is invoked without an argument it declares as required
- **THEN** it is refused and the command does not run

#### Scenario: An argument of the wrong kind is refused

- **WHEN** a command is invoked with an argument whose value is not of the declared kind
- **THEN** it is refused and the command does not run

#### Scenario: A value that is not data does not cross

- **WHEN** a sandboxed plugin invokes a command with an argument that cannot be carried as data
- **THEN** the invocation is refused, rather than the command running against a value that lost
  what it was

#### Scenario: A choice that appears after registration is offered and accepted

- **WHEN** a plugin running in the page registers a command whose choices grow afterwards, and the
  command is described, or invoked with a choice that was added later
- **THEN** the description lists the added choice, and the invocation runs

#### Scenario: An isolated plugin's choices are the ones it registered

- **WHEN** an isolated plugin registers a command with a set of choices
- **THEN** exactly those choices are offered and accepted until it registers the command again

## ADDED Requirements

### Requirement: Invocations waiting side by side are not a chain

The workbench SHALL refuse an invocation by identity that continues a chain of invocations too deep
to be anything but a loop. A chain SHALL be counted only where one command is invoked from within
another command's run before that run first waits for anything. Invocations that run side by side,
each waiting for something such as the user's answer, SHALL NOT count towards the limit, so that any
number of them can be pending while an unrelated command is invoked.

The limit stops a command that invokes itself, directly or through others, without waiting in
between. It SHALL NOT be relied on to stop a loop whose steps each wait before invoking the next;
such a loop is the invoking plugin's own behaviour.

#### Scenario: Pending invocations do not block an unrelated one

- **WHEN** more invocations than the chain limit allows are each waiting for the user, and another
  command is invoked
- **THEN** it runs

#### Scenario: A command that keeps invoking itself is stopped

- **WHEN** a command invokes itself from within its own run, again and again, without waiting in
  between
- **THEN** the invocation beyond the limit is refused as too deep, and the refusal reaches the caller

### Requirement: The connection an agent drives answers every call it opened

The connection that runs the workbench's commands for an agent SHALL answer every call the agent
opened, including the calls still open when the agent's run ends, because an agent that sent calls
expects an answer to each and most agents will not continue without them. When a run ends, the
connection SHALL answer the calls left open one at a time, each time it is asked, until none is left,
so that a consumer which asks until nothing is answered has answered all of them.

A call still open when the run ends never received all of its arguments. It SHALL be answered as
refused, saying why, and the command it named SHALL NOT run.

#### Scenario: Every call left open is answered

- **WHEN** a run ends with three calls whose closing never arrived, and the consumer asks until
  nothing is answered
- **THEN** each of the three is answered exactly once, and the next request answers nothing

#### Scenario: A call left open does not run

- **WHEN** a run ends with a call whose closing never arrived
- **THEN** it is answered as refused, and the command it named does not run

#### Scenario: A call that closed runs as before

- **WHEN** a call closes before the run ends
- **THEN** its command runs and its outcome is the answer, as before
