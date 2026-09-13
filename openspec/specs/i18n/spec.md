# i18n Specification

## Purpose
Every piece of text the workbench puts on screen can be translated, and a product can reword any of
it without forking what the platform ships. Text reaches the screen from three owners at once — the
shell's own chrome, the plugin bundles a distribution composes, and the distribution's own branding
— so the capability's job is to let all three contribute to one language bundle while keeping them
from overwriting each other by accident.

## Requirements

### Requirement: The shell owns the translations of its own chrome

The platform SHALL ship the strings of its own workbench, and a distribution SHALL serve them
unchanged as the base language bundle. A distribution that composes nothing else MUST still have a
fully translated workbench.

#### Scenario: A bare distribution has a translated workbench

- **WHEN** a distribution registers no additional translation bundle
- **THEN** the base language bundle is the only one requested
- **AND** every label the workbench draws resolves from it

#### Scenario: A shell string added in a later release needs no action from the product

- **WHEN** a release adds a new label to the workbench
- **THEN** a distribution that already serves the base bundle shows it translated without changing
  anything of its own

### Requirement: A contributed bundle is nested under its own name

A distribution SHALL be able to declare additional translation bundles by name. Each named bundle
is served at a location derived from that name and the language, and the workbench SHALL nest its
contents under that name. A contributed key therefore MUST NOT be able to replace a key the shell
ships, whatever it is called.

Declarations SHALL accumulate. A distribution that declares bundles in more than one place, whether
by hand or because a generator added a second declaration beside the first, loads every bundle
named in any of them, in the order they were declared. A later declaration MUST NOT replace an
earlier one. A name declared twice is loaded once.

#### Scenario: A plugin bundle's strings live under the plugin's namespace

- **WHEN** a distribution declares a named translation bundle and the bundle contains a key whose
  spelling matches one the shell ships
- **THEN** the contributed key is reachable only under the declared name
- **AND** the shell's own key keeps its shipped value

#### Scenario: Branding stays translatable

- **WHEN** a distribution supplies its product tagline through a named bundle rather than as a
  literal
- **THEN** the tagline is translated like any other string, in every language the bundle covers

#### Scenario: Two declarations load both bundles

- **WHEN** a distribution declares one bundle in one place and another bundle in a second place
- **THEN** both bundles are requested for the active language
- **AND** each is nested under its own name

#### Scenario: A name declared twice is loaded once

- **WHEN** two declarations name the same bundle
- **THEN** that bundle is requested once and nested under its name once

### Requirement: One unavailable bundle does not take the rest with it

Where a declared translation bundle cannot be loaded, the workbench SHALL keep the base bundle and
every other declared bundle, and SHALL report the failure rather than failing the language load.

#### Scenario: A missing plugin bundle leaves the rest intact

- **WHEN** one of several declared bundles cannot be fetched for the active language
- **THEN** the base bundle and the remaining declared bundles are applied
- **AND** the failure is reported to the developer console

### Requirement: A product may reword any string the workbench shows

A distribution SHALL be able to supply an overlay that replaces named strings. The overlay is
merged key by key and applied after everything else, so it reaches the shell's own chrome and the
strings of any plugin bundle the distribution composes. Naming a key replaces it; naming nothing
inherits it, including keys introduced by later releases.

The overlay MUST be an explicit opt-in, and the directory it is loaded from MUST be selectable, so
that one build can carry several wordings.

#### Scenario: Rewording one label leaves its siblings alone

- **WHEN** an overlay names a single key
- **THEN** that key takes the overlay's value
- **AND** every sibling key keeps the value the platform ships, including keys the overlay does not
  know about

#### Scenario: The overlay reaches a composed plugin's strings

- **WHEN** an overlay names a key belonging to a plugin bundle the distribution composes
- **THEN** the overlay's value is used, because the overlay is applied last

#### Scenario: No overlay is requested unless the product asked for one

- **WHEN** a distribution does not opt into overlays
- **THEN** no overlay is requested for any language

#### Scenario: One build serves several wordings

- **WHEN** a distribution names the directory its overlays are served from
- **THEN** overlays for every language are loaded from that directory

#### Scenario: A directory that would fetch the base bundle as its own overlay is refused

- **WHEN** the named overlay directory reduces to the root of the served application
- **THEN** the distribution is refused at composition time with a message naming the default
- **AND** the application does not start with an overlay that silently duplicates the base bundle

### Requirement: An overlay that changes nothing says so

Because an overlay is optional per language and per key, both of its silent failure modes SHALL be
reported to the developer: a language for which no overlay is served, and an overlay key that names
a string nothing ships.

#### Scenario: A language without an overlay keeps its shipped strings

- **WHEN** overlays are enabled and no overlay exists for the active language
- **THEN** the shipped strings are used unchanged
- **AND** the developer is told that this is what happened

#### Scenario: A mistyped overlay key is named

- **WHEN** an overlay names a key that neither the shell nor any composed bundle ships
- **THEN** the key is reported as one that will never appear

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

### Requirement: A language change is applied everywhere at once

Choosing a language SHALL update what the user sees, what the document reports as its language, and
what is remembered for the next visit — as one act, with no partially switched state in between.

#### Scenario: Switching the language updates the page and the record of it

- **WHEN** the user chooses a language
- **THEN** the workbench re-renders in that language
- **AND** the document's declared language matches it
- **AND** the choice is stored for the next visit

### Requirement: A language change reaches the app's other windows

Where the same application is open more than once, a language change in one window SHALL be applied
in the others without a reload.

#### Scenario: A second window follows the first

- **WHEN** the language is changed in one window of the application
- **THEN** another open window of the same application switches to it as well

### Requirement: An isolated plugin surface follows the language without reloading

A plugin surface that runs isolated from the workbench cannot read the language for itself. The
workbench SHALL therefore send the active language to such a surface, and SHALL send it again
whenever it changes, so the surface re-renders in place rather than being reloaded.

#### Scenario: An isolated surface is told the language

- **WHEN** an isolated plugin surface is shown
- **THEN** it receives the active language as part of the state the workbench pushes to it

#### Scenario: An isolated surface follows a language change

- **WHEN** the language changes while an isolated plugin surface is shown
- **THEN** the surface receives the new language
- **AND** it is not reloaded

### Requirement: A key is not reported missing while nothing is loaded

The workbench paints chrome — strip labels, tab titles, seeded workspace tabs — as soon as it has
it, which can be before the language bundle has arrived. Every key looked up in that window would
otherwise count as missing. The workbench SHALL stay silent about missing keys until a bundle for
the active language has loaded, and from then on SHALL report them.

This SHALL NOT be switchable by a product, because a product cannot turn off a diagnostic about a
problem it did not cause.

#### Scenario: The boot does not produce a burst of false warnings

- **WHEN** a key is looked up before any bundle for the active language has loaded
- **THEN** nothing is reported
- **AND** the key itself is returned, so the surface renders

#### Scenario: A genuinely missing key is reported

- **WHEN** a key is looked up after a bundle for the active language has loaded and that bundle does
  not contain it
- **THEN** it is reported as missing

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
