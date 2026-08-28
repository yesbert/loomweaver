# plugin-sandbox Specification

## Purpose
A plugin can run in a frame of its own for two different reasons, and this capability covers both.
**Distrust**: code the operator has not written should not be able to reach into the application
that hosts it. **Independence**: an organisation splits its application across teams that deploy
separately, the code is entirely trusted, and what it needs is the session and the storage that the
first reason denies. So the frame is one mechanism with two levels, and the composition chooses.

What the level changes is what the browser enforces around the plugin — nothing else. The contract,
the contributions, the permission model and what the workbench sends are the same at either level,
and everything crossing the boundary is still data, with everything the plugin cannot fetch for
itself still having to be sent.

Every guarantee below says which level it is about. Where one names the isolated level, the
permissive one makes no such promise, and the workbench does not imply otherwise: an embedded
application is trusted code, and saying so is the honest half of offering the level at all.

## Requirements

### Requirement: An isolated plugin reaches the same contract, through the same permission model

A plugin running isolated SHALL reach the same contract as one running in the page, and SHALL be
subject to the same default-deny permission model, decided by the same broker. Isolation SHALL be a
deployment property, not a second contract.

#### Scenario: The same contribution works at either isolation level

- **WHEN** an isolated plugin registers a contribution
- **THEN** it appears exactly as the same contribution from a plugin running in the page

#### Scenario: Permissions are enforced identically

- **WHEN** an isolated plugin uses a part of the contract it was not granted
- **THEN** it is refused, as it would be in the page

### Requirement: A frame plugin runs at a level the composition chooses

A plugin running in a frame SHALL run at one of two levels, and the level SHALL be part of how the
application was composed.

At the **isolated** level the plugin SHALL be stripped of an origin of its own, which is what denies
it the hosting document, any storage and any session the browser would otherwise carry for it. This
SHALL remain the default: a plugin whose level was not stated SHALL run isolated.

At the **embedded** level the plugin SHALL keep an origin, and with it whatever the browser grants
that origin — its storage, its cookies and the session they carry. The workbench SHALL NOT claim
that such a plugin is held back from the hosting application; the level exists to separate teams and
deployments, not privileges.

Both levels SHALL reach the same contract, be brokered by the same permissions, and be told the same
things about their surroundings. Only what the browser enforces around them differs.

#### Scenario: An unstated level is the isolated one

- **WHEN** a plugin is registered without a level
- **THEN** it runs isolated

#### Scenario: An embedded plugin keeps what its origin carries

- **WHEN** a plugin composed at the embedded level runs
- **THEN** it reaches the storage and the session of the origin it was served from

#### Scenario: The contract does not change with the level

- **WHEN** the same plugin runs at either level
- **THEN** it registers the same contributions, is granted capabilities the same way, and receives
  the same surroundings

### Requirement: The level is capped by the composition, and may be asked for below the cap

The composition SHALL decide the highest level a plugin may run at, and where plugins arrive from a
catalogue SHALL decide it for that catalogue as a whole. Nothing a plugin or an entry says SHALL be
able to exceed that cap.

A plugin or an entry MAY ask for a level. A request at or below the cap SHALL be honoured, so that
something needing no privilege can limit itself. A request above the cap SHALL be refused outright
rather than quietly satisfied at a lower one: a plugin running below what it needs fails in ways
nobody can diagnose, and a silent demotion hides the misconfiguration that caused it.

The level SHALL NOT be revocable, because withdrawing it does not reduce a plugin but breaks it —
the same reasoning that already keeps the right to contribute off the switches. It SHALL be shown
wherever what a plugin may do is shown, because it is the most consequential thing about it.

#### Scenario: A request below the cap is honoured

- **WHEN** a plugin asks for a level lower than the cap
- **THEN** it runs at the level it asked for

#### Scenario: A request above the cap is refused

- **WHEN** a plugin or an entry asks for a level beyond the cap
- **THEN** it is refused, rather than run at the cap or below it

#### Scenario: The level is not among the switches

- **WHEN** the user views the permissions of a plugin
- **THEN** the level is stated but is not something that can be withdrawn

### Requirement: Isolation comes from the boundary, not from where the code is served

A plugin running at the **isolated** level SHALL be executed with no access to the hosting document —
no shared globals, no reach into its storage, no ability to navigate it. That SHALL be a property of
how it is embedded rather than of where its files come from.

At the **embedded** level no such guarantee is made, and the workbench SHALL NOT imply one. What
separates an embedded plugin from the hosting application is its own document and its own
deployment, which is a separation of concerns rather than of privilege.

Separating a plugin's deployment does not separate the plugin. Where its document is served at the
application's own address, the browser treats it as the application, whatever produced the bytes and
however many hops away that was. A separation the browser cannot see is a separation of operations,
not of privilege, and SHALL NOT be presented as one.

#### Scenario: An isolated plugin cannot reach the hosting document

- **WHEN** an isolated plugin runs
- **THEN** it cannot read or change the hosting document, its storage or its address

#### Scenario: An embedded plugin is not claimed to be contained

- **WHEN** a plugin runs at the embedded level
- **THEN** nothing presents it as restricted from the hosting application

#### Scenario: A separately deployed plugin at the application's address is not separated

- **WHEN** an embedded plugin's document is deployed on its own but served at the application's own
  address
- **THEN** it reaches the hosting application, its storage and its session as any part of the
  application would, and nothing presents it as separated from them

### Requirement: What a plugin reaches beyond the workbench follows from its level

The workbench decides what a plugin reaches **through** it. What a plugin obtains for itself, by
asking the network directly, is decided by the browser instead, and follows from the level the
plugin runs at. The workbench SHALL NOT claim otherwise, and SHALL NOT be described as governing it.

At the **isolated** level the plugin has no origin of its own, so its requests carry no origin the
answering service can recognise and no session the browser would keep for it. It SHALL therefore be
able to obtain only what that service makes readable without one. A plugin whose data is not public
cannot be served at this level by fetching it, and the workbench offers no way around that.

At the **embedded** level, and in the application's own context, requests carry whatever the browser
grants the origin the plugin's document was served from — including any session that origin carries.
No guarantee is made about what such a plugin may read.

#### Scenario: An isolated plugin reaches only what needs no session

- **WHEN** an isolated plugin asks a service for something that service releases only to a
  recognised caller
- **THEN** it does not receive it, and nothing the workbench offers changes that

#### Scenario: An isolated plugin reaches what is readable by anyone

- **WHEN** an isolated plugin asks a service for something that service releases to any caller
- **THEN** it receives it

#### Scenario: An embedded plugin is not claimed to be held back from data

- **WHEN** a plugin runs at the embedded level
- **THEN** nothing presents it as restricted in what it may obtain for itself

### Requirement: Everything crossing the boundary is validated as data

Every declaration an isolated plugin sends SHALL be rebuilt field by field from known fields, with
anything unrecognised or wrongly typed dropped. A declaration missing what it needs SHALL be
rejected rather than partially accepted, and nested structures SHALL be rebuilt to a bounded depth
rather than followed indefinitely.

#### Scenario: An unknown field does not cross

- **WHEN** an isolated plugin sends a declaration carrying fields the workbench does not know
- **THEN** they are dropped and the known fields are used

#### Scenario: An incomplete declaration is refused

- **WHEN** a declaration lacks something it cannot work without
- **THEN** it is refused rather than registered incompletely

#### Scenario: A deeply nested declaration is stopped

- **WHEN** a declaration nests beyond a bounded depth
- **THEN** it is stopped rather than followed

### Requirement: A function never crosses the boundary

Anything a plugin sends that would be a function on the other side SHALL be dropped rather than
proxied. Where the workbench needs to tell the plugin something in return, it SHALL do so by calling
a method the plugin exposes.

#### Scenario: A callback attached to a declaration is dropped

- **WHEN** an isolated plugin includes a callback in something it registers
- **THEN** the callback does not cross, and the rest of the declaration is used

#### Scenario: The workbench notifies the plugin instead

- **WHEN** something happens that a callback would have reported
- **THEN** the workbench calls a method the plugin exposes for it

### Requirement: An isolated plugin's own surface must be same-origin

A surface a frame plugin declares SHALL be refused unless it is served from an origin the
composition permitted for that plugin. Where no origin was permitted, that SHALL be the
application's own. Addresses that would execute or carry their content inline SHALL be rejected at
every level.

A plugin running in the page MAY embed a foreign origin; where it does, the application's own
content policy is what governs it.

#### Scenario: A foreign surface address is refused

- **WHEN** a frame plugin declares a surface served from an origin the composition did not permit
- **THEN** it is refused

#### Scenario: A surface from a permitted origin is accepted

- **WHEN** a frame plugin declares a surface served from an origin the composition permitted for it
- **THEN** it is accepted, and the boundary is maintained as at any other origin

#### Scenario: An executable or embedded address is refused

- **WHEN** a frame plugin declares a surface whose address would execute or carry its content
  inline
- **THEN** it is refused

### Requirement: An isolated surface is told what it cannot read

Because a surface in a frame cannot read the hosting document, the workbench SHALL send it what it
needs to render and behave correctly, and SHALL send it again whenever it changes: the active
language, the current presentation, the resolved design tokens, the interface size, its own position
in the address, whether it is currently being shown, and the session where the plugin is permitted
it.

The values sent SHALL be the resolved ones, so that a product's or a tenant's overrides travel
without a mechanism of their own.

Whether a surface is being shown SHALL follow from the workbench, not from the browser's own idea of
visibility, so that a surface the user has switched away from is told so even while the window
remains in front.

#### Scenario: An isolated surface follows the application's appearance

- **WHEN** the application's presentation or tokens change
- **THEN** the isolated surface receives the new values and re-renders in place

#### Scenario: The values sent are the effective ones

- **WHEN** a product or a plugin has overridden a token
- **THEN** the isolated surface receives the overridden value, not the platform default

#### Scenario: A surface is not sent what its plugin may not have

- **WHEN** the plugin lacks the permission for the session
- **THEN** no session is sent at all, rather than an empty one

#### Scenario: A retained surface is told it is no longer shown

- **WHEN** the user switches away from a surface that is retained rather than destroyed
- **THEN** the surface is told it is no longer being shown, and told again when it returns

### Requirement: An isolated surface may act, within its own boundary

An isolated surface SHALL be able to ask the workbench to do things on its behalf, and those
requests SHALL be constrained to what the surface itself owns. In particular it SHALL be able to
move within its own address space and SHALL NOT be able to navigate the application elsewhere.

#### Scenario: A surface moves within its own address

- **WHEN** an isolated surface asks to move to one of its own sub-addresses
- **THEN** the workbench does so

#### Scenario: A surface cannot navigate the application away

- **WHEN** an isolated surface asks to move outside what it owns
- **THEN** the request is refused

### Requirement: The workbench's own controls are available inside an isolated surface

The workbench SHALL make its element family, its style contracts and its symbol set available to an
isolated surface, served by the distribution so that their version always matches the workbench's.
A surface using them SHALL be indistinguishable from the workbench's own chrome.

What the distribution serves SHALL also be **described**: the controls, and the entry point through
which a surface reaches its symbols, its render state and its own store, SHALL come with a
machine-readable description of their shape, so that an author writing against them in a checked
language is told about a wrong name or a wrong argument before the surface runs. The description
SHALL be published with the thing it describes and carry its version, so the two cannot drift apart.

The description covers what the surface reaches through the served entry point. It does not make the
served bundle importable as a module: it is loaded by reference and installs itself, and that does
not change.

#### Scenario: A workbench control inside an isolated surface looks like one

- **WHEN** an isolated surface uses one of the workbench's elements or style classes
- **THEN** it renders as it does in the workbench's own chrome, including in dark presentation

#### Scenario: A plugin's own symbols work there too

- **WHEN** an isolated surface uses a symbol its plugin contributed
- **THEN** it renders alongside the workbench's own

#### Scenario: A surface author is told about a wrong call before it runs

- **WHEN** an author writes a surface in a checked language and calls the served entry point with a
  name or an argument it does not have
- **THEN** the mistake is reported while they are writing it, rather than as a failure inside the
  frame at run time

#### Scenario: The description travels with what it describes

- **WHEN** a distribution takes a given version of what the workbench serves to a frame
- **THEN** it receives the description of that same version, without asking for it separately

### Requirement: A plugin's lifecycle survives the boundary

Spawning an isolated plugin SHALL be idempotent, tearing it down SHALL remove its execution
environment, its connection and its contributions, and a failed connection SHALL be reported and
cleaned up rather than left half-established.

#### Scenario: Spawning twice does not run it twice

- **WHEN** activation runs again for an already-running isolated plugin
- **THEN** it is not spawned a second time

#### Scenario: Tearing down leaves nothing behind

- **WHEN** an isolated plugin is deactivated
- **THEN** its environment, its connection and its contributions are all gone

#### Scenario: A failed connection is cleaned up

- **WHEN** the connection to an isolated plugin cannot be established
- **THEN** the failure is reported and nothing is left behind

### Requirement: An isolated plugin can offer settings without owning them

An isolated plugin SHALL be able to declare a settings section as data, and the workbench SHALL
draw it, store the values and tell the plugin what they are — initially and on every change,
including a change made in another window. Identities SHALL be namespaced to the plugin, and where a
section belongs to a plugin the user installed it SHALL be grouped apart from the product's own.

#### Scenario: A declared section is drawn and stored by the workbench

- **WHEN** an isolated plugin declares a settings section
- **THEN** the workbench draws it and persists what the user chooses

#### Scenario: The plugin is told the values

- **WHEN** the section is first built and whenever a value changes
- **THEN** the plugin receives the current values

#### Scenario: A change in another window reaches the plugin

- **WHEN** the same setting is changed in another window
- **THEN** this window's plugin is told

### Requirement: A composed frame plugin may be named for the user

A composition MAY give a frame plugin a name. Where it does, every surface that names that plugin to
the user SHALL show that name. Where it does not, those surfaces SHALL show the plugin's identifier,
and SHALL NOT derive a friendlier one from it.

The identifier SHALL remain what the plugin is keyed on — grants, collisions and stored decisions all
follow the identifier, never the name — so naming a plugin SHALL change nothing but what is read.

#### Scenario: A named plugin is shown by its name

- **WHEN** a composition names a frame plugin and the user opens a surface listing plugins
- **THEN** the plugin appears under that name

#### Scenario: An unnamed plugin is shown by its identifier

- **WHEN** a composition names no name for a frame plugin
- **THEN** the plugin appears under its identifier, unchanged

#### Scenario: The name is read, never matched

- **WHEN** two compositions give the same plugin different names
- **THEN** what each was granted, and what the user decided about it, is the same in both
