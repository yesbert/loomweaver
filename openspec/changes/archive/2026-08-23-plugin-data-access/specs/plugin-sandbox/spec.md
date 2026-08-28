## ADDED Requirements

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

## MODIFIED Requirements

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
