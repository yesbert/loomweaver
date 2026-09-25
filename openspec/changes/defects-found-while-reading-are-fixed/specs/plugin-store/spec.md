## MODIFIED Requirements

### Requirement: A deployed plugin is visibly not the user's

The workbench SHALL show a deployed plugin among what is active, SHALL make clear that it was
provided rather than chosen, and SHALL NOT offer to remove it or to turn it off. A user SHALL never
be left unable to tell why something is present or why they cannot take it away.

Where a switch is withheld, a state that switch could have left behind SHALL NOT be honoured. A
deployed plugin SHALL run regardless of a disabling stored while the same identity was the user's
own, so that withholding the switch can never strand them with something turned off and no way to
turn it on.

Browsing the catalogue SHALL show a deployed plugin as provided and SHALL NOT offer to install it,
and an installation of a deployed identity SHALL be refused, so that no record of the user's own can
wait behind the deployment and take over when it is withdrawn.

#### Scenario: A deployed plugin says where it came from

- **WHEN** the user views what is active
- **THEN** a deployed plugin is listed and marked as provided rather than chosen

#### Scenario: A stored disabling of it is not honoured

- **WHEN** the operator deploys a plugin whose identity the user had installed and turned off
- **THEN** it runs, and the stored disabling is disregarded rather than leaving it off

#### Scenario: Removal is not offered for it

- **WHEN** the user views a deployed plugin
- **THEN** no route to remove it is offered

#### Scenario: Browsing a deployed plugin offers no install

- **WHEN** the user browses the catalogue and opens an entry the operator deployed
- **THEN** it is marked as provided, and no install is offered

#### Scenario: Installing a deployed identity is refused

- **WHEN** an installation of a plugin the operator deployed is attempted by any route
- **THEN** it is refused and nothing is recorded as the user's own

### Requirement: Browsing is a list and a detail, with the plugin's own description shown in place

The catalogue SHALL be browsable as a searchable list with a detail view, searching across the
fields a user would recognise. Where an entry supplies a description document, it SHALL be rendered
inside the application rather than by sending the user elsewhere, and it SHALL come from the
product's own origin like everything else. A link to the plugin's home SHALL be an ordinary link,
never embedded.

On a screen too narrow to show the list and the detail side by side, the detail SHALL replace the
list and offer a way back to it, so that everything the detail offers, installing included, stays
reachable.

#### Scenario: Searching matches what a user would type

- **WHEN** the user types part of a name, an author or a description
- **THEN** the matching entries are shown

#### Scenario: The description is rendered in place

- **WHEN** an entry supplies a description document
- **THEN** it is rendered within the application

#### Scenario: A description from elsewhere is not fetched

- **WHEN** an entry's description document is served from another origin
- **THEN** it is not fetched, and the entry remains usable

#### Scenario: A narrow screen loses nothing

- **WHEN** the store is browsed on a screen too narrow for the list and the detail side by side, and
  the user opens an entry
- **THEN** its detail replaces the list, with its install action and a way back to the list
