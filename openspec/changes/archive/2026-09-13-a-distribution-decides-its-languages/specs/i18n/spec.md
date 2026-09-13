## REMOVED Requirements

### Requirement: The workbench serves the languages it ships, and says which

**Reason**: It fixed the served set to the languages the workbench ships and stated that a
product's further language is not reflected in the document. Both are replaced by the distribution
deciding the set, which is stated in *A distribution decides which languages the workbench serves*.
Its guarantee that the offered set is derived from the served set, and that a further language
reaches the switcher without a second list, is carried over there unchanged.

**Migration**: A distribution that declares nothing is served exactly the shipped languages, as
before. A distribution that replaced translation loading to serve a further language declares the
set instead and supplies the workbench's strings for that language where the shipped languages are
served from.

## MODIFIED Requirements

### Requirement: The starting language is resolved before the first paint

The workbench SHALL determine its starting language before it renders anything, from the languages
the distribution serves: a previously chosen language if it is still served, otherwise the first of
the user's browser preferences that matches a served language, otherwise English if it is served,
otherwise the first language the distribution declared.

A browser preference SHALL match a served language when it names that language exactly, or when it
names a regional form of it and the region-less language is served.

Because this answer is needed before the application's services exist, it is read from
device-local storage rather than through the product's settings port. A product whose settings live
behind a network therefore MUST accept that the first paint uses the device-local answer and that
its stored preference is applied once it arrives.

#### Scenario: A previous choice is honoured

- **WHEN** a language the workbench serves was chosen on this device before
- **THEN** the workbench starts in that language

#### Scenario: An unusable stored value does not strand the user

- **WHEN** the stored value names a language the workbench does not serve, including one a previous
  declaration served and the current one leaves out
- **THEN** it is ignored and the browser preference decides

#### Scenario: A regional browser preference selects its language

- **WHEN** the browser prefers a regional form of a language and the distribution serves that
  language without a region
- **THEN** the workbench starts in the served language

#### Scenario: English is the last resort

- **WHEN** neither a stored value nor any browser preference names a language the workbench serves
- **AND** English is served
- **THEN** the workbench starts in English

#### Scenario: Without English, the first declared language is the last resort

- **WHEN** neither a stored value nor any browser preference names a language the workbench serves
- **AND** the distribution's declaration does not include English
- **THEN** the workbench starts in the first language the distribution declared

#### Scenario: A network-stored preference arrives after the first paint

- **WHEN** the product's settings port later reports a different language
- **THEN** the workbench switches to it
- **AND** it does not write that value back, because nothing about it changed

## ADDED Requirements

### Requirement: A distribution decides which languages the workbench serves

A distribution SHALL be able to declare the whole set of languages the workbench serves, by language
code. The declaration SHALL be able to add languages the workbench does not ship, to leave out
languages it does ship, and to name a set containing none of the shipped languages. A distribution
that declares nothing SHALL be served the languages the workbench ships.

The declared set SHALL be the only set: what the workbench loads, what it offers to the user, what a
stored or browser preference may select, and what the document declares as its language SHALL all
be derived from it, so that no language can be served and unreachable, or offered and unserved.

Each offered language SHALL be named in that language itself, derived from its code rather than from
a list kept beside the set, so that a language added to the declaration is named without anything
else being edited. Where no name can be derived for a code, the code itself is shown.

A declaration that names no language, or that names something that is not a language code, SHALL be
refused when the distribution is composed, with a message saying which.

#### Scenario: The switcher offers what the workbench serves

- **WHEN** the user opens the language switcher
- **THEN** it offers the served languages and no others

#### Scenario: A distribution that declares nothing serves the shipped languages

- **WHEN** a distribution declares no set of languages
- **THEN** the switcher offers the languages the workbench ships and no others

#### Scenario: A further served language reaches the switcher

- **WHEN** a distribution declares a set containing a language the workbench does not ship
- **THEN** the switcher offers it, named in that language, without a second list being edited

#### Scenario: A shipped language left out of the declaration is not offered

- **WHEN** a distribution declares a set that omits a language the workbench ships
- **THEN** the switcher does not offer it
- **AND** no preference, stored or from the browser, selects it

#### Scenario: A set without any shipped language is served

- **WHEN** a distribution declares a set containing none of the languages the workbench ships
- **THEN** the workbench starts in one of the declared languages and offers only those

#### Scenario: The document declares the language in use

- **WHEN** the user is working in a declared language the workbench does not ship
- **THEN** the language the document declares is that language

#### Scenario: An empty or malformed declaration is refused

- **WHEN** a distribution declares an empty set, or a set containing something that is not a
  language code
- **THEN** the distribution is refused at composition time with a message naming the problem

### Requirement: Workbench strings a served language lacks are shown in English, and named

For a served language the workbench does not ship, the product SHALL supply the workbench's own
strings in that language, in the place the shipped languages are served from. Any workbench string
the product does not supply SHALL be shown in English rather than as its key or as nothing, and the
developer SHALL be told which strings those are.

Where the product supplies none of the workbench's strings for a served language, the workbench SHALL
be shown in English throughout while that language is active, and the developer SHALL be told that
this is what happened. Neither case SHALL prevent the language from being served.

This concerns the workbench's own strings. The strings of a named bundle and of an overlay keep the
behaviour stated for them.

#### Scenario: A partly translated language shows the rest in English

- **WHEN** a product serves a language the workbench does not ship and supplies only some of the
  workbench's strings in it
- **THEN** the supplied strings are shown in that language
- **AND** the rest are shown in English
- **AND** the developer is told which strings were not supplied

#### Scenario: A language with no workbench strings is still served

- **WHEN** a product serves a language the workbench does not ship and supplies none of the
  workbench's strings in it
- **THEN** the workbench is shown in English while that language is active
- **AND** the developer is told that no workbench strings were found for it
- **AND** the document still declares that language

#### Scenario: A later release's new string is shown in English until supplied

- **WHEN** a release adds a workbench string and a product's served language does not supply it
- **THEN** it is shown in English and named to the developer

### Requirement: A product can read and change the language

A product SHALL be able to read the active language, the served languages with the name of each in
its own language, and SHALL be able to change the active language. A change made by a product SHALL
be the same act as a change made through the workbench's own switcher: applied everywhere at once,
remembered, and carried to the application's other windows and isolated surfaces.

The names a product reads SHALL be the ones the workbench's own switcher shows, so that a control a
product draws in place of the switcher offers the same languages under the same names.

A change to a language that is not served SHALL be refused, leaving the active language as it was,
and the developer SHALL be told.

#### Scenario: A product's own control changes the language

- **WHEN** a product's own control changes the language to a served one
- **THEN** the workbench re-renders in that language, the document declares it and the choice is
  remembered, exactly as when the workbench's switcher is used

#### Scenario: A product's control and the workbench's agree

- **WHEN** a product draws its own language control in one place and the workbench's switcher is
  shown in another
- **AND** the language is changed through either
- **THEN** both show the new language

#### Scenario: A product reads the same names the switcher shows

- **WHEN** a product reads the served languages
- **THEN** it receives each with the name the workbench's switcher shows for it

#### Scenario: An unserved language is refused

- **WHEN** a product changes the language to one that is not served
- **THEN** the active language stays as it was
- **AND** the developer is told
