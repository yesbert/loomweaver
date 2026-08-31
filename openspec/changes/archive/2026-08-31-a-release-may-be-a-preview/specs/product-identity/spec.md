## MODIFIED Requirements

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
