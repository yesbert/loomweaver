## MODIFIED Requirements

### Requirement: A tab carries its own label, and keeps it

A tab SHALL carry the title and icon it was opened with, which MAY be a translation key or a
literal, and these SHALL survive a restart. Where a tab has no label of its own, the workbench SHALL
derive one from the content's declaration, and where it can derive nothing it SHALL show the address
rather than an empty tab.

A derived label SHALL NOT become the tab's own. What is kept across a restart SHALL be only what the
tab carried, so a label the workbench worked out from a declaration is worked out again each time
and corrects itself when the declaration it rests on changes or first appears.

A declaration at the address that names nothing SHALL NOT be a declaration for every address. Where
the address a tab carries has no declaration of its own, the workbench SHALL derive nothing and show
the address, rather than borrowing the label of whatever answers the bare address.

Where a tab was stored with a label it could not have carried, the workbench SHALL drop that label
as it loads, so a profile written before this recovers without the user clearing browser storage.

#### Scenario: A refined title survives a restart

- **WHEN** content refines its tab's title and the application restarts
- **THEN** the refined title is shown

#### Scenario: A tab with nothing to go on shows its address

- **WHEN** neither the tab nor any declaration supplies a title
- **THEN** the address is shown

#### Scenario: A label worked out for a tab is not saved as the tab's own

- **WHEN** a tab whose label the workbench derived is written to a workspace's stored panes
- **THEN** what is stored carries no label

#### Scenario: A tab waiting for its content does not borrow the home label

- **WHEN** a workspace is restored holding a tab whose content registers later, and another surface
  answers the address that names nothing
- **THEN** the tab shows its address rather than that surface's title and icon

#### Scenario: A tab refines itself once its content arrives

- **WHEN** the content that answers a restored tab's address registers
- **THEN** the tab shows the title and icon that content declares, with no restart

#### Scenario: A profile carrying a borrowed label recovers on its own

- **WHEN** stored panes hold a tab carrying a title and icon the tab could not have carried, and
  the application is opened
- **THEN** both are dropped as the panes load, and the tab is labelled from its own content
