## ADDED Requirements

### Requirement: A command may take described arguments and give an answer

A command MAY declare the arguments it accepts and MAY answer with a result. What it declares SHALL
be discoverable without running it: each argument SHALL carry a name, the kind of value it takes,
whether it is required, and a description of what it means.

Both the arguments and the answer SHALL be plain data, because they cross the boundary between a
plugin and the workbench unchanged. A value that cannot be carried as data SHALL be refused rather
than arriving stripped of what it was.

A command that declares no arguments SHALL keep working exactly as it does today, invoked with none.

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

### Requirement: A command may be described for a reader that is not looking at the screen

A command MAY carry a description separate from the title the workbench draws. The title exists to
label a control; the description exists to explain the action to something choosing between actions.
The description MAY be given either as a translation key or as a literal.

A command with no description SHALL be left without one rather than being given the title in its
place, because a label is not an explanation.

#### Scenario: The description is not the label

- **WHEN** a command carries both a title and a description
- **THEN** the workbench draws the title on controls, and offers the description where an action is
  being explained rather than labelled

#### Scenario: A command without a description is not given a substitute

- **WHEN** a command carries no description
- **THEN** it has none, and its title is not presented as one

### Requirement: A command is closed to callers other than its own plugin unless it says otherwise

A command SHALL declare whether a caller other than the plugin that registered it may invoke it. The
default SHALL be that it may not: an undeclared command is unreachable to a foreign caller, by every
route, and is absent from anything that lists what such a caller may reach.

The plugin that registered a command SHALL always be able to invoke its own, and SHALL need no
declaration and no grant to do so.

The declaration SHALL open nothing further. A command that declares itself open is still subject to
every rule that already governs it, so a session that does not qualify for it cannot reach it that
way either.

#### Scenario: An undeclared command is unreachable to a foreign caller

- **WHEN** a plugin invokes a command registered by another plugin that has not declared itself open
- **THEN** it is refused and the command does not run

#### Scenario: A plugin reaches its own commands regardless

- **WHEN** a plugin invokes a command it registered itself, which declares nothing
- **THEN** it runs

#### Scenario: Declaring openness does not bypass access gating

- **WHEN** a command declares itself open and the session does not meet its access requirement
- **THEN** a foreign caller naming it is refused, exactly as every other trigger would be

### Requirement: A command invoked by identity answers the caller that invoked it

A caller MAY invoke a command by its identity and SHALL receive what it answered. The invocation
SHALL run through the one place every trigger already runs through, so access gating, the rule about
a window showing a single piece of work and failure reporting apply to it unchanged.

A refusal SHALL reach the caller as a refusal, and a failure SHALL reach the caller as a failure,
distinguishable from each other and from an answer. Reaching the caller SHALL NOT replace the
existing duty to surface a refusal to the user.

Naming a command nothing registered SHALL be refused rather than silently doing nothing.

#### Scenario: The answer reaches the caller

- **WHEN** a caller invokes a command that answers with a result
- **THEN** it receives that result

#### Scenario: A refusal and a failure are told apart

- **WHEN** a caller invokes a command it may not reach, and separately invokes one that throws
- **THEN** it can tell the refusal from the failure, and neither is presented as an answer

#### Scenario: A refusal still reaches the user

- **WHEN** a caller is refused a command for lack of permission
- **THEN** the user is told, as they already are for every other route

#### Scenario: A command that does not belong in a detached window is not reachable there

- **WHEN** a caller in a window showing a single piece of work invokes a command that has not
  declared itself suitable there
- **THEN** it is refused and the command does not run

#### Scenario: An unknown identity is refused

- **WHEN** a caller invokes a command nothing registered
- **THEN** it is refused, rather than the call appearing to succeed

### Requirement: What a caller may reach can be enumerated, already narrowed

The workbench SHALL be able to list the commands a given caller may invoke, in a predictable order,
so that a caller can offer them onward without keeping a list of its own. The list SHALL hold the
commands that declared themselves open, whoever registered them, and SHALL already be narrowed by
every rule that would refuse the invocation: whether the session meets the command's access
requirement, whether it belongs in the window the caller is in, and — for a command the caller does
not own — what the calling plugin has been granted.

The list SHALL follow the registered commands, so an entry appears and disappears with the plugin
that owns it, and SHALL follow the session, so an entry appears once the session qualifies for it.

Everything the list holds SHALL run when invoked, and anything the seam would refuse SHALL be absent
from it, so that the list is never a wider account than the seam. The reverse is not guaranteed: a
plugin's commands that it never opened are its own behaviour, and it reaches them whether or not
they are listed.

#### Scenario: The list holds only what would actually run

- **WHEN** a caller lists the commands it may invoke
- **THEN** every entry is one that would run if invoked, and nothing that would be refused is listed

#### Scenario: A command the session does not qualify for is absent, and appears when it does

- **WHEN** the session does not meet a command's access requirement
- **THEN** it is not listed, and it is listed once the session meets it

#### Scenario: The list follows the plugins

- **WHEN** the plugin that registered a listed command is deactivated
- **THEN** the command is no longer listed

#### Scenario: A detached window lists only what belongs there

- **WHEN** a caller in a window showing a single piece of work lists what it may invoke
- **THEN** only commands that declared themselves suitable there are listed

#### Scenario: A command that never opened itself is not listed to its own plugin either

- **WHEN** a plugin lists what it may invoke and it registered a command that declares nothing
- **THEN** that command is not listed
- **AND** the plugin still reaches it by invoking it
