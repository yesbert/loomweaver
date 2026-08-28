## MODIFIED Requirements

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
