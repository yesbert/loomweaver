## ADDED Requirements

### Requirement: The agent connection can act on a command's statement when the product asks it to

The connection that runs the workbench's commands for an agent SHALL offer a policy a product may
choose to apply before each call, acting on what the called command states about an agent's word. A
product that does not apply it SHALL be asked nothing and SHALL have nothing decided for it, as
before.

Applied, the policy SHALL decline a call to a command that is not to be run on an agent's word,
saying so to the agent; SHALL let a call through where the command states the agent's word is enough,
or states nothing; and SHALL put the call to the person through a confirmation the product supplies
where the command asks for the person first or every time. For a command that asks for the person
first, a yes SHALL be remembered for the rest of that connection and SHALL NOT be asked again; for a
command that asks every time, nothing SHALL be remembered. A no SHALL decline the call, saying so to
the agent. The policy SHALL NOT widen anything: a call it lets through is still only as reachable as
the workbench makes it.

#### Scenario: A product that does not apply the policy is asked nothing

- **WHEN** an agent calls a command that asks for the person first, and the product applied no policy
- **THEN** nothing is asked and the command runs as it did before

#### Scenario: A command that asks first is asked once per connection

- **WHEN** the policy is applied, an agent calls a command that asks for the person first twice on
  one connection, and the person says yes the first time
- **THEN** the person is asked once, and both calls run

#### Scenario: A command that asks every time is asked every time

- **WHEN** the policy is applied and an agent calls a command that asks every time twice
- **THEN** the person is asked twice

#### Scenario: A command not to be run on an agent's word is declined

- **WHEN** the policy is applied and an agent calls a command that is not to be run on an agent's word
- **THEN** the call is declined with a reason the agent receives, and nobody is asked

#### Scenario: A no declines the call

- **WHEN** the person answers no to the confirmation
- **THEN** the call is declined with a reason the agent receives, and the command does not run
