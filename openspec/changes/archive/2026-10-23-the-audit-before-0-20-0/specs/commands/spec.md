## ADDED Requirements

### Requirement: The connection an agent drives runs only what it offered

The connection that runs the workbench's commands for an agent SHALL run a call only where the
command it names is among the tools it offers at that moment. A call that names anything else SHALL be
answered as refused, saying why, and SHALL NOT run, even where the plugin holding the connection could
run that command itself. A command its plugin did not open to callers is therefore beyond an agent's
reach through the connection, as the platform states for every other caller.

Each tool SHALL be named in a form the common model interfaces accept: letters, digits, underscores
and hyphens, and no longer than they allow. The connection SHALL translate a call's tool name back to
the command it stands for, and two commands SHALL NOT be offered under the same name.

#### Scenario: A command the plugin never opened is refused

- **WHEN** an agent calls a command that the plugin holding the connection registered without opening
  it to callers
- **THEN** the call is answered as refused, saying why, and the command does not run

#### Scenario: A tool name is one the model interfaces accept

- **WHEN** a callable command whose id contains dots is offered as a tool
- **THEN** its tool name contains only letters, digits, underscores and hyphens
- **AND** a call under that name runs that command
