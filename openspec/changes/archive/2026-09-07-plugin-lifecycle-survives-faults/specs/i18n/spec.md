## MODIFIED Requirements

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
