# product-identity Specification

## Purpose
An application built on this platform is one product with one name, and the workbench is its frame
rather than a thing of its own. It also has to keep itself current without the user thinking about
it, which for a web application means noticing a new version, saying so, and being able to recover
when its own offline storage is what broke.

## Requirements

### Requirement: A distribution supplies its identity, and the workbench presents it

A distribution SHALL supply the name, tagline and mark of the product, and the workbench SHALL draw
those rather than anything of its own. The platform SHALL fall back to its own identity only where
nothing is supplied, so that an unbranded build still runs.

The identity SHALL be supplied as composition, not discovered, so that one installation is one
product.

#### Scenario: The product's own identity is what the user sees

- **WHEN** a distribution supplies its identity
- **THEN** the workbench presents that name and mark

#### Scenario: An unbranded build still runs

- **WHEN** no identity is supplied
- **THEN** the platform's own identity is used

#### Scenario: The tagline is translatable

- **WHEN** the tagline is supplied as a translation key
- **THEN** it is translated like any other text

### Requirement: A distribution is an installable application

A distribution SHALL be installable as an application in its own right, presenting its own name and
mark, and SHALL work offline to the extent that its shell and its translations are available without
the network. Installability SHALL be on by default and SHALL be switchable off by the distribution.

#### Scenario: The installed application carries the product's identity

- **WHEN** the application is installed
- **THEN** it presents the product's own name and mark

#### Scenario: The offline shell is not left untranslated

- **WHEN** the installed application is opened without a network
- **THEN** its text is translated rather than showing raw keys

#### Scenario: A distribution may decline installability

- **WHEN** a distribution switches it off
- **THEN** nothing is registered and no offline behaviour is claimed

### Requirement: A new version is noticed and offered, never forced

Where a new version becomes available, the workbench SHALL tell the user and offer to apply it. It
SHALL NOT reload underneath them. The notice and any persistent marker SHALL reflect one state, so
dismissing the notice does not hide the fact.

#### Scenario: A ready update is offered rather than applied

- **WHEN** a new version has been prepared
- **THEN** the user is told and offered a reload, and nothing reloads on its own

#### Scenario: Dismissing the notice leaves the marker

- **WHEN** the user dismisses the notice
- **THEN** the persistent marker still shows that an update is waiting

### Requirement: The workbench never claims to be current when it is not

A check for updates SHALL NOT report "up to date" while an update is waiting or while an update has
failed. Where the workbench cannot answer — because the page is not yet under the control of its
offline machinery — it SHALL wait a bounded time and then say what it does know rather than guessing.

#### Scenario: A check does not overwrite a waiting update

- **WHEN** the user checks for updates while one is waiting
- **THEN** the waiting update is raised again rather than "up to date" being reported

#### Scenario: A check does not overwrite a failure

- **WHEN** the user checks for updates after an installation failed
- **THEN** the failure is raised again

#### Scenario: An unanswerable check says so

- **WHEN** the page never comes under the control of the offline machinery
- **THEN** the workbench asks the user to reload rather than reporting a state it cannot determine

### Requirement: A failed update is distinguished from broken offline storage

The workbench SHALL distinguish an update that failed to install from offline storage that is beyond
repair, and SHALL say which. In the second case it SHALL be able to recover: discarding its own
offline machinery and cached content before reloading, leaving anything not its own untouched.

Recovery SHALL never be a dead end — a failure while recovering SHALL still result in a reload.

#### Scenario: A broken cache is named for what it is

- **WHEN** the offline machinery reports itself beyond repair
- **THEN** the user is told that the offline storage is broken, not that the update failed

#### Scenario: Recovery discards only what belongs to this application

- **WHEN** the workbench recovers from broken offline storage
- **THEN** its own machinery and caches are discarded and anything belonging to another application
  is left alone

#### Scenario: Recovery always ends in a reload

- **WHEN** discarding the broken machinery itself fails
- **THEN** the application still reloads

#### Scenario: A healthy update is not treated as broken

- **WHEN** an update is applied normally
- **THEN** nothing is discarded

### Requirement: The workbench looks for updates by itself, quietly

The workbench SHALL check for updates periodically and when the user returns to it, without raising
a notice for a check that finds nothing. Repeated checks SHALL be throttled, and background checking
SHALL stop once an update is already waiting.

#### Scenario: A long-lived session learns about a new version

- **WHEN** the application has been open for a long time and a new version is deployed
- **THEN** the workbench notices without the user asking

#### Scenario: A quiet check stays quiet

- **WHEN** a background check finds nothing
- **THEN** nothing is shown

#### Scenario: Checking stops once there is something waiting

- **WHEN** an update is already waiting
- **THEN** the workbench stops checking in the background

### Requirement: Applying an update asks before losing work

Applying an update SHALL go through the same question as any other action that would destroy unsaved
work, and SHALL be abandoned if the user declines.

#### Scenario: Unsaved work is protected from an update

- **WHEN** the user applies an update while work is unsaved
- **THEN** they are asked, and declining leaves the application as it was

### Requirement: The running version is visible

The workbench SHALL expose the version it was built as, so that a distribution can show it and a
user can report it. It SHALL be stamped from one source at build time rather than maintained by
hand.

What is exposed SHALL also say whether that version is a preview of a line that has not been
released, so a distribution learns it by asking rather than by taking the version apart. A version
that is not a preview SHALL say so just as plainly; there is no third answer.

Announcing it remains the distribution's, as showing the version already is. The workbench SHALL NOT
decide how prominently a preview is marked, or mark it anywhere the distribution did not ask for,
because how loudly a product tells its users that it is unfinished is a product's judgement and not
the workbench's.

#### Scenario: The running version is reported

- **WHEN** a distribution shows the version
- **THEN** it is the version the build was stamped with

#### Scenario: A preview says that it is one

- **WHEN** the build was stamped with a version marked as a preview
- **THEN** what the workbench exposes says the running version is a preview
- **AND** a distribution learns it without inspecting the version itself

#### Scenario: A released version is not mistaken for a preview

- **WHEN** the build was stamped with a version of a released line
- **THEN** what the workbench exposes says the running version is not a preview

#### Scenario: The workbench marks nothing on its own

- **WHEN** a preview is running and the distribution marks it nowhere
- **THEN** the workbench adds no marking of its own beyond the version it already showed
