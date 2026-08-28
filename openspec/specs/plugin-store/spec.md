# plugin-store Specification

## Purpose
An application should be extensible without a developer rebuilding it. The platform's answer is a
catalogue the operator curates, and it carries two different things. What it **offers**, the user
browses, consents to and installs — and what this capability owes them there is that consent is
meaningful and that nothing changes it behind their back. What it **deploys**, the operator has
already decided: it is active without being asked about, because the decision was made before the
user opened the application. The line between the two is authority, and every guarantee below says
which of them it is about.

## Requirements

### Requirement: The catalogue is the operator's, and is read defensively

A distribution SHALL be able to supply a catalogue of installable plugins, served from its own
origin. The workbench SHALL read it defensively: an entry it cannot use SHALL be dropped, a field it
cannot use SHALL be dropped while the entry stays, and a catalogue served from elsewhere SHALL be
refused outright.

#### Scenario: An unusable entry does not break the catalogue

- **WHEN** the catalogue contains an entry the workbench cannot use
- **THEN** that entry is dropped and the rest of the catalogue is offered

#### Scenario: An unusable field does not lose the entry

- **WHEN** an entry carries a field the workbench cannot use
- **THEN** the field is dropped and the entry stays

#### Scenario: A catalogue from another origin is refused

- **WHEN** the catalogue is served from another origin
- **THEN** it is refused before anything is fetched

#### Scenario: A catalogue that cannot be fetched says so

- **WHEN** the catalogue cannot be loaded
- **THEN** the user is shown that it failed rather than an empty list

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

### Requirement: A plugin is installed only from the product's own origin

Installation SHALL be refused unless the plugin is served from the application's own origin. This
SHALL be enforced when installing and again when reading what was installed previously, so that
altered stored state cannot introduce a plugin from elsewhere.

Installing something the product already composes, or something already installed, SHALL be refused.

#### Scenario: A plugin from another origin cannot be installed

- **WHEN** an entry names a location on another origin
- **THEN** installing it is refused

#### Scenario: Altered stored state cannot smuggle a plugin in

- **WHEN** the stored record of installed plugins is altered to name another origin
- **THEN** that entry is not loaded

#### Scenario: A plugin the product ships cannot be shadowed

- **WHEN** an installable entry uses the identity of a plugin the product composes
- **THEN** the composed one is used

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

### Requirement: Installing and removing take effect immediately

An installed plugin SHALL start without a reload, and removing one SHALL unload it and take its
contributions with it. Both SHALL survive a restart. Removing SHALL ask first, and SHALL be
abandoned if the user declines.

#### Scenario: A newly installed plugin appears at once

- **WHEN** the user installs a plugin
- **THEN** its contributions appear without a reload

#### Scenario: Removing takes its contributions with it

- **WHEN** the user removes a plugin
- **THEN** its contributions disappear without a reload

#### Scenario: Removing asks first

- **WHEN** the user removes a plugin
- **THEN** they are asked to confirm, and declining leaves it installed

#### Scenario: An installed plugin is still there after a restart

- **WHEN** the application restarts
- **THEN** the installed plugins are running

### Requirement: An update is offered only when there is one, and never widens permissions silently

The workbench SHALL offer an update where the catalogue holds a strictly newer version, comparing
versions by their numeric parts rather than as text. Applying an update SHALL reload the plugin's
code even where the location is unchanged.

Where the new version asks for permissions the user has not already agreed to, they SHALL be asked
again, and SHALL be shown only what is new. Where nothing has grown, the update SHALL apply without
a question.

#### Scenario: An older catalogue entry offers no update

- **WHEN** the catalogue holds a version equal to or older than the installed one
- **THEN** no update is offered

#### Scenario: Version comparison is numeric

- **WHEN** two versions differ in a part whose text order differs from its numeric order
- **THEN** the numerically newer one is treated as newer

#### Scenario: New permissions are asked for, and only the new ones

- **WHEN** an update declares permissions beyond what was agreed
- **THEN** the user is asked, and shown only the additional ones

#### Scenario: An update with no new permissions applies directly

- **WHEN** an update declares nothing beyond what was agreed
- **THEN** it applies without a question

#### Scenario: The same location with new files still updates

- **WHEN** an update keeps the same location and changes only its version
- **THEN** the plugin is reloaded rather than left running the previous code

### Requirement: Applying an update protects unsaved work

Applying an update SHALL go through the same question as any other action that would destroy unsaved
work, and declining SHALL leave the plugin as it was. A declined permission consent SHALL never
reach that stage.

#### Scenario: Unsaved work in the plugin is protected

- **WHEN** the user updates a plugin whose surface holds unsaved work
- **THEN** they are asked, and declining leaves the installed version running

#### Scenario: Declining the permissions stops before anything else

- **WHEN** the user declines the additional permissions
- **THEN** nothing further is asked and nothing changes

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

### Requirement: An installed plugin's settings are grouped apart from the product's

Settings contributed by a plugin the user installed SHALL be grouped separately from those of the
plugins the product composes, and the grouping SHALL be decided by the workbench rather than claimed
by the plugin.

#### Scenario: An installed plugin cannot present itself as part of the product

- **WHEN** an installed plugin contributes a settings section
- **THEN** it is grouped with the installed plugins, whatever it asks for

### Requirement: Browsing is a list and a detail, with the plugin's own description shown in place

The catalogue SHALL be browsable as a searchable list with a detail view, searching across the
fields a user would recognise. Where an entry supplies a description document, it SHALL be rendered
inside the application rather than by sending the user elsewhere, and it SHALL come from the
product's own origin like everything else. A link to the plugin's home SHALL be an ordinary link,
never embedded.

#### Scenario: Searching matches what a user would type

- **WHEN** the user types part of a name, an author or a description
- **THEN** the matching entries are shown

#### Scenario: The description is rendered in place

- **WHEN** an entry supplies a description document
- **THEN** it is rendered within the application

#### Scenario: A description from elsewhere is not fetched

- **WHEN** an entry's description document is served from another origin
- **THEN** it is not fetched, and the entry remains usable
