# plugin-permissions Specification

## Purpose
A plugin reaches host services and host state through one context object, and this capability
decides what that context will actually do for it. The model is default-deny: a plugin holds only
what it was explicitly granted, the grant can never exceed what the plugin itself asked for, and
the person using the application can take any of it back.

## Requirements

### Requirement: A plugin holds nothing it was not granted

Every part of the context that reaches host services, host state or the address of the content area
SHALL be gated on a capability. A plugin without that capability SHALL be refused, loudly and
identifiably, rather than receiving a silent no-op.

This governs the context, and only the context. Data a plugin obtains for itself, without asking the
workbench for it, passes no capability and is refused by nothing here — what such a plugin reaches
follows from the level it runs at instead. The workbench SHALL NOT present the capabilities as
though they decided it.

#### Scenario: An ungranted plugin is refused everything

- **WHEN** a plugin is composed with no capabilities at all
- **THEN** every gated part of its context refuses it

#### Scenario: A refusal names what was missing

- **WHEN** a plugin uses a part of the context it was not granted
- **THEN** the failure names the missing capability and the plugin that asked

#### Scenario: A refusal does not stop the other plugins

- **WHEN** one plugin is refused during activation
- **THEN** the other composed plugins activate normally

#### Scenario: A plugin that fetches for itself passes no capability

- **WHEN** a plugin obtains data without going through the context
- **THEN** no capability is consulted, and the workbench claims no say over what it obtained

### Requirement: The workbench hands a plugin no credential

Nothing the workbench sends a plugin on its own account SHALL be usable to present the user to a
service, and the workbench SHALL offer no path whose purpose is to deliver one. What it tells a
plugin about the person using the application SHALL be limited to what that plugin needs in order to
gate itself: whether someone is signed in, and which opaque roles they hold.

This is what keeps the decision about what a plugin may see where it can still be made. A plugin
holding a credential of its own is answerable to nobody afterwards, because the service it presents
it to cannot tell the plugin from the person.

#### Scenario: A permitted session tells a plugin who, not how

- **WHEN** a plugin is permitted the session
- **THEN** it is told whether someone is signed in and which roles they hold, and nothing further
  that a service would accept as that person

#### Scenario: A permitted session tells an isolated surface the same and no more

- **WHEN** a surface of an isolated plugin is sent the session it is permitted
- **THEN** what arrives is whether someone is signed in and which roles they hold, and nothing
  further that a service would accept as that person

### Requirement: A grant is what the distribution allows, intersected with what the plugin asks for

The plugin SHALL declare the capabilities it needs and the distribution SHALL grant them; what is
effective is the intersection. A grant for something the plugin does not declare SHALL have no
effect, so least privilege holds from both directions, and the mismatch SHALL be reported to the
developer.

#### Scenario: A grant beyond the declaration is inert

- **WHEN** a distribution grants a capability the plugin does not declare
- **THEN** the plugin does not hold it
- **AND** the developer is told that the grant was ignored

#### Scenario: A declaration without a grant is not enough

- **WHEN** a plugin declares a capability the distribution did not grant
- **THEN** the plugin does not hold it

### Requirement: The user may revoke a granted capability, and it takes effect at once

A user SHALL be able to withdraw any capability a plugin was granted. The withdrawal SHALL apply
from the plugin's next use of that part of the context, without a reload, and SHALL survive a
restart. Restoring it SHALL work the same way.

A user SHALL NOT be able to grant beyond what the distribution allowed — revocation only ever
subtracts.

Where a plugin was deployed by the operator rather than chosen by the user, the permissions surface
SHALL state what it holds and SHALL NOT offer to withdraw it. Withdrawing a capability such a plugin
was issued with does not restrain software the user is answerable for; it breaks software they were
given, in a way they cannot be expected to connect to the switch they pressed.

#### Scenario: Revocation applies without a reload

- **WHEN** the user revokes a capability from an active plugin
- **THEN** the plugin's next use of that part of the context is refused

#### Scenario: A revocation survives a restart

- **WHEN** the application starts and a capability was previously revoked
- **THEN** it is still withheld

#### Scenario: Restoring returns the capability

- **WHEN** the user restores a revoked capability
- **THEN** the plugin may use that part of the context again

#### Scenario: Revocation cannot widen a grant

- **WHEN** the user views the permissions of a plugin
- **THEN** only capabilities the distribution granted can be switched at all

#### Scenario: A deployed plugin's permissions are shown but not switchable

- **WHEN** the user views the permissions of a plugin the operator deployed
- **THEN** what it holds is stated, and no switch to withdraw it is offered

### Requirement: Revoking the right to contribute is not offered

The capability that lets a plugin register contributions SHALL NOT be revocable at runtime. It is
consulted when a plugin activates, so withdrawing it later would change nothing while appearing to,
and a stored revocation of it SHALL be discarded rather than honoured.

The way to remove everything a plugin contributes is to turn the plugin off.

#### Scenario: The contribute right is absent from the switches

- **WHEN** the user views the permissions of a plugin
- **THEN** the right to register contributions is not among the switches offered

#### Scenario: A stale stored revocation of it is discarded

- **WHEN** the application starts and storage holds a revocation of the contribute right
- **THEN** it is dropped rather than applied

### Requirement: Activation is never blocked by a revocation

Whether a plugin may activate SHALL be decided by what the distribution granted, not by what the
user has since revoked. Otherwise revoking one capability would silently unload the whole plugin.

#### Scenario: A plugin with a revoked capability still activates

- **WHEN** a plugin whose capability the user revoked is activated
- **THEN** it activates, and only the revoked part of its context refuses it

### Requirement: A refusal tells the user, and never locks them out

Where a refusal happens because of a user's own revocation, the workbench SHALL say so and SHALL
offer a way to the place where it can be undone. The workbench's own route to its settings SHALL
remain reachable no matter what has been revoked, so a user can never revoke themselves out of the
ability to restore.

This SHALL NOT depend on where the refusal arose. An action a plugin takes from inside its own
surface counts as much as one the workbench invoked on the plugin's behalf, and a refusal that
nothing catches SHALL reach the user in either case.

For a plugin running in the page the workbench can see that the plugin handled its own refusal, and
SHALL then stay silent. Across the frame boundary it cannot see that: a refusal there returns to the
plugin as a rejected answer, and whether the plugin absorbed it is not observable from here. A
refusal crossing that boundary SHALL therefore be reported whether or not the plugin handled it, and
the workbench SHALL NOT claim the quieter behaviour for it.

#### Scenario: A blocked action explains itself

- **WHEN** an action fails because the plugin behind it lacks a capability
- **THEN** the user is told, and offered a way to the permission settings

#### Scenario: A refusal inside a plugin's own surface is not swallowed

- **WHEN** a plugin running in the page is refused while acting from its own surface, and does not
  handle the refusal itself
- **THEN** the user is told, exactly as when the workbench invoked the action

#### Scenario: A plugin that handles its own refusal does not raise a notice

- **WHEN** a plugin running in the page catches its own refusal
- **THEN** the workbench raises no notice of its own

#### Scenario: A refusal across the frame boundary is reported

- **WHEN** a plugin running in a frame is refused a capability it asked to use
- **THEN** the user is told, whether or not the plugin handled the refusal on its own side

#### Scenario: Settings stay reachable when everything is revoked

- **WHEN** every capability of every plugin is revoked
- **THEN** the workbench's own way into its settings still works

### Requirement: The set of capabilities is coarse and enumerable

The workbench SHALL offer a small, fixed set of coarse capabilities, each naming a slice of the
context, and SHALL be able to enumerate them so that a permission surface can list them without
knowing them individually.

#### Scenario: A permission surface lists what exists

- **WHEN** the workbench draws the permissions of a plugin
- **THEN** it offers the revocable capabilities the platform defines, ordered predictably

### Requirement: The permissions surface states the rung a plugin really runs at

Where the permissions surface describes how much a plugin is held back, that description SHALL be
true of the plugin it stands under. A plugin running in the application's own context SHALL NOT be
described as unable to reach the application, its storage or the user's session.

Every rung a plugin can be composed at SHALL have its own account. Where a rung has none, the
surface SHALL say nothing about isolation rather than borrow the account of another rung, because a
missing sentence misleads no one and a borrowed one does.

#### Scenario: A trusted plugin is not called isolated

- **WHEN** the user opens the permissions surface with a trusted, in-process plugin composed
- **THEN** what it says about that plugin does not claim the plugin is held back from the
  application, its storage or the session

#### Scenario: An isolated plugin is still called isolated

- **WHEN** the user opens the permissions surface with a plugin composed at the isolated level
- **THEN** it says that the plugin cannot reach the application, its storage or the session

#### Scenario: Each rung is described as itself

- **WHEN** plugins composed at different rungs are listed together
- **THEN** each description belongs to the rung of the plugin it stands under

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
