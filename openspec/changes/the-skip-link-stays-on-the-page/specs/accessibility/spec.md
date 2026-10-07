## ADDED Requirements

### Requirement: The first tab stop is a way past the chrome that stays on the page

Where the workbench draws a content area, the first stop in its focus order SHALL be a link that
moves the focus to the working area. Activating it SHALL NOT navigate: the application SHALL NOT
load again, and the address, the arrangement and any unsaved work SHALL stay as they were. This
SHALL hold at every address the application serves, not only at the root, and under any base the
distribution is served from.

The limit: a pop-out window draws no chrome to skip, so it carries no such link.

#### Scenario: The skip link at the root

- **WHEN** the person presses Tab once on a freshly loaded workbench at the root address and
  activates the focused link
- **THEN** the focus is in the working area

#### Scenario: The skip link below the root does not reload

- **WHEN** the workbench shows an address below the root and the person activates the skip link
- **THEN** the focus is in the working area
- **AND** no document is loaded and the address is unchanged

#### Scenario: Unsaved work survives the skip link

- **WHEN** a surface holds work that is not saved and the person activates the skip link
- **THEN** the work is still there, and the workbench asks no question about leaving
