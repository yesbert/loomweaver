## ADDED Requirements

### Requirement: A catalogue offers some plugins and deploys others

An entry SHALL say whether it is **offered** to the user or **deployed** by the operator. An offered
entry SHALL reach the user only through the consent it already requires. A deployed entry SHALL be
active without consent, holding exactly the permissions the entry names and no others, and SHALL
stop being active once the catalogue no longer carries it.

Authority SHALL decide an identity collision. A composed plugin SHALL win over anything a catalogue
carries, as it already does against what a user installed. A deployed entry SHALL win over the same
identity the user installed, because it holds exactly what it names and a consent the user gave to a
narrower declaration must not be able to undercut what the operator issued.

#### Scenario: A deployed entry needs no consent

- **WHEN** the catalogue carries an entry marked as deployed
- **THEN** it is active without the user being asked, holding the permissions the entry names

#### Scenario: Withdrawing a deployed entry removes it

- **WHEN** a catalogue that answers no longer carries an entry it previously deployed
- **THEN** that plugin is no longer active

#### Scenario: A deployed entry wins over the same identity the user installed

- **WHEN** the catalogue deploys a plugin whose identity the user had already installed
- **THEN** the deployed entry is what runs, holding what it names

#### Scenario: A permission the platform does not define is still dropped

- **WHEN** a deployed entry names a permission the platform does not define
- **THEN** it is dropped, exactly as it is for an offered entry

### Requirement: A deployed plugin is visibly not the user's

The workbench SHALL show a deployed plugin among what is active, SHALL make clear that it was
provided rather than chosen, and SHALL NOT offer to remove it or to turn it off. A user SHALL never
be left unable to tell why something is present or why they cannot take it away.

Where a switch is withheld, a state that switch could have left behind SHALL NOT be honoured. A
deployed plugin SHALL run regardless of a disabling stored while the same identity was the user's
own, so that withholding the switch can never strand them with something turned off and no way to
turn it on.

#### Scenario: A deployed plugin says where it came from

- **WHEN** the user views what is active
- **THEN** a deployed plugin is listed and marked as provided rather than chosen

#### Scenario: A stored disabling of it is not honoured

- **WHEN** the operator deploys a plugin whose identity the user had installed and turned off
- **THEN** it runs, and the stored disabling is disregarded rather than leaving it off

#### Scenario: Removal is not offered for it

- **WHEN** the user views a deployed plugin
- **THEN** no route to remove it is offered

### Requirement: A catalogue that deploys is read at startup, and losing it does not lose what it deployed

Where a catalogue deploys plugins, the workbench SHALL read it as the application starts, so that an
entry added reaches every user on their next load and an entry withdrawn leaves them the same way.

The set last seen SHALL be kept through the same persistence seam the workbench uses for what it
remembers. A catalogue that cannot be reached SHALL leave the plugins it last deployed active,
rather than starting an application without the features it is expected to have. A catalogue that
answers SHALL replace that set entirely.

#### Scenario: A new entry reaches the user on the next start

- **WHEN** an entry is added to the catalogue and the user loads the application again
- **THEN** the plugin is active, with no further step on their part

#### Scenario: An unreachable catalogue keeps what it last deployed

- **WHEN** the catalogue cannot be reached at startup
- **THEN** the plugins it last deployed are active, and the failure is reported rather than silent

#### Scenario: An answering catalogue replaces the remembered set

- **WHEN** the catalogue answers
- **THEN** what it says is what is deployed, and anything remembered from before is discarded

## MODIFIED Requirements

### Requirement: Installing asks, and what is asked is what is granted

Before installing a plugin **the user chose**, the workbench SHALL show what the plugin will be
permitted to do and SHALL install only if the user agrees. What they agreed to SHALL be exactly what
the plugin holds, and a permission the plugin did not declare SHALL NOT be grantable by the
catalogue.

A plugin the operator deployed is not installed by the user and SHALL NOT be gated on their consent.
What it holds is what its entry names, and the authority for that is the operator's rather than
theirs.

#### Scenario: Declining installs nothing

- **WHEN** the user declines the consent
- **THEN** nothing is installed

#### Scenario: Agreeing grants exactly what was shown

- **WHEN** the user agrees
- **THEN** the plugin holds the permissions shown and no others

#### Scenario: An unknown permission never reaches the user

- **WHEN** a catalogue entry names a permission the platform does not define
- **THEN** it is dropped before the user is asked

#### Scenario: A deployed plugin is not asked about

- **WHEN** a catalogue deploys a plugin
- **THEN** no consent is sought, and it holds what its entry names

### Requirement: The user can see and manage what they installed

The workbench SHALL show the installed plugins with their state, and SHALL let the user turn each on
or off, reach its own settings where it has any, and remove it. A plugin without settings of its own
SHALL NOT be offered a route to them.

What the operator deployed SHALL be shown alongside, with its settings reachable in the same way, but
SHALL NOT be offered the controls that belong to ownership — turning it off, or removing it.

#### Scenario: A plugin's own settings are one step away

- **WHEN** an installed plugin contributes a settings section
- **THEN** the user can reach it from the list of installed plugins

#### Scenario: A plugin without settings offers no route to them

- **WHEN** an installed plugin contributes no settings section
- **THEN** no such route is offered for it

#### Scenario: A deployed plugin's settings are reachable, its removal is not

- **WHEN** a deployed plugin contributes a settings section
- **THEN** the user can reach it, and is offered no way to turn the plugin off or remove it
