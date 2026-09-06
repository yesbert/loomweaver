## MODIFIED Requirements

### Requirement: A distribution supplies its identity, and the workbench presents it

A distribution SHALL supply the name, tagline and mark of the product, and the workbench SHALL draw
those rather than anything of its own. The platform SHALL fall back to its own identity only where
nothing is supplied, so that an unbranded build still runs.

The identity SHALL be supplied as composition, not discovered, so that one installation is one
product.

Where the frame is too narrow to show the name beside the mark, the mark alone SHALL stand for the
product, and the name SHALL remain its accessible name. The tagline SHALL give way before the name,
and the name before the mark, so that what identifies the product is the last thing to go.

#### Scenario: The product's own identity is what the user sees

- **WHEN** a distribution supplies its identity
- **THEN** the workbench presents that name and mark

#### Scenario: An unbranded build still runs

- **WHEN** no identity is supplied
- **THEN** the platform's own identity is used

#### Scenario: The tagline is translatable

- **WHEN** the tagline is supplied as a translation key
- **THEN** it is translated like any other text

#### Scenario: On a narrow frame the mark stands for the product

- **WHEN** the frame is too narrow for side panels beside the content
- **THEN** the mark is shown and the name is not
- **AND** the entry is still announced by the product's name
