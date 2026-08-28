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

#### Scenario: A plugin bundle's strings live under the plugin's namespace

- **WHEN** a distribution declares a named translation bundle and the bundle contains a key whose
  spelling matches one the shell ships
- **THEN** the contributed key is reachable only under the declared name
- **AND** the shell's own key keeps its shipped value

#### Scenario: Branding stays translatable

- **WHEN** a distribution supplies its product tagline through a named bundle rather than as a
  literal
- **THEN** the tagline is translated like any other string, in every language the bundle covers

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

The workbench SHALL determine its starting language before it renders anything: a previously chosen
language if there is one, otherwise the first of the user's browser preferences that the workbench
can serve, otherwise English.

Because this answer is needed before the application's services exist, it is read from
device-local storage rather than through the product's settings port. A product whose settings live
behind a network therefore MUST accept that the first paint uses the device-local answer and that
its stored preference is applied once it arrives.

#### Scenario: A previous choice is honoured

- **WHEN** a language the workbench serves was chosen on this device before
- **THEN** the workbench starts in that language

#### Scenario: An unusable stored value does not strand the user

- **WHEN** the stored value names a language the workbench does not serve
- **THEN** it is ignored and the browser preference decides

#### Scenario: English is the last resort

- **WHEN** neither a stored value nor any browser preference names a language the workbench serves
- **THEN** the workbench starts in English

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

### Requirement: The workbench serves the languages it ships, and says which

The workbench SHALL serve a fixed set of languages of its own and offer exactly those to the user.
The offered set SHALL be derived from the served set rather than maintained beside it, so that
serving a further language cannot leave it unreachable.

A product MAY replace the loading of translations entirely to serve further languages; if it does,
it takes over the whole subject, and the language the document reports remains the one the
workbench resolved.

#### Scenario: The switcher offers what the workbench can serve

- **WHEN** the user opens the language switcher
- **THEN** it offers the languages the workbench ships and no others

#### Scenario: A further served language reaches the switcher

- **WHEN** a language is added to the set the workbench serves
- **THEN** the switcher offers it, without a second list being edited

#### Scenario: A product-supplied third language is not reflected in the document language

- **WHEN** a product replaces translation loading and serves a language the workbench does not ship
- **THEN** its strings are used
- **AND** the language the document declares is still the one the workbench resolved
