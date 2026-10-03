## MODIFIED Requirements

### Requirement: Each kind of region has a fixed anatomy

Each kind of region SHALL have a fixed internal structure that plugins do not extend: a bar has
named slots, a launcher rail has an anchored top and bottom band, a panel has a header with actions
and a body, and the content area has its own strip and body. A plugin SHALL choose a region and a
slot within that fixed vocabulary, and SHALL NOT invent sub-slots.

A toolbar a plugin places in its own content is not a region: the distribution does not declare it,
the frame does not draw it, and it is neither reported against the layout nor curated with the
rails and sidebars. It is a menu slot drawn open, and is governed where menus are.

#### Scenario: A contribution names a region and a place within its anatomy

- **WHEN** a plugin contributes to a bar
- **THEN** it names one of the bar's slots, and the workbench draws it there

#### Scenario: A contribution to the wrong kind of region is reported

- **WHEN** a plugin contributes an item to a region whose kind cannot hold it
- **THEN** the developer is told, naming the kind

#### Scenario: A placed toolbar is not a region

- **WHEN** a plugin registers a toolbar and places it in its own content
- **THEN** the layout is unchanged, nothing is reported against it, and it is absent from the
  checklist that curates what lives in each rail and sidebar
