## ADDED Requirements

### Requirement: Invoking a command a plugin does not own is a capability of its own

Reaching a command registered by another plugin SHALL require a granted capability, listed and
revocable beside the others the platform defines. Without it a plugin SHALL neither invoke such a
command nor learn that it exists, so that a refusal cannot be turned into a way of discovering what
is installed. What it may list without the grant SHALL therefore hold nothing beyond the commands it
registered itself.

The capability SHALL cover only commands the plugin does not own. A plugin invoking a command it
registered itself SHALL need no grant, because that is its own behaviour and it could run it
directly.

The grant SHALL open no more than the seam already allows: holding it lets a plugin reach the
commands that declared themselves open to a foreign caller and that the session qualifies for, and
nothing beyond them.

#### Scenario: Without the grant, nothing is reachable and nothing is visible

- **WHEN** a plugin without the grant invokes a command another plugin registered
- **THEN** it is refused
- **AND** listing what it may invoke yields nothing beyond commands it registered itself, whatever
  else is installed

#### Scenario: The grant reaches only what was opened

- **WHEN** a plugin holding the grant lists what it may invoke
- **THEN** it sees the commands that declared themselves open and that the session qualifies for,
  and no others

#### Scenario: A plugin's own commands need no grant

- **WHEN** a plugin without the grant invokes a command it registered itself
- **THEN** it runs

#### Scenario: Revoking it takes effect at once

- **WHEN** the user revokes the grant from a running plugin
- **THEN** its next invocation of a command it does not own is refused, without a reload
- **AND** what it may list holds nothing beyond its own commands
