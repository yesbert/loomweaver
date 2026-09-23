## MODIFIED Requirements

### Requirement: A tab carries its own label, and keeps it

A tab SHALL carry the title, icon and badge it was opened with, which MAY be a translation key or a
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

#### Scenario: A badge a tab was opened with survives a restart

- **WHEN** a content tab is opened with a badge of its own and the application restarts
- **THEN** the tab shows that badge again

## ADDED Requirements

### Requirement: A tab may carry a badge beside its title

A tab SHALL show a badge where it has one: its own, given when it was opened, or else the badge of
the surface it shows. In a strip that shows titles, the badge SHALL stand after the title, drawn in
the tone it names, and SHALL NOT be a control of its own, so the tab stays a single stop for the
keyboard. The badge's text SHALL be part of the tab's accessible name, after the title and before
any word about unsaved work, so a screen reader announces "Erweitert, Developer" rather than the
title alone.

In a strip that shows icons only, there is no room for text beside an icon; the badge's text SHALL
then be part of the tab's tooltip and accessible name.

The limit: a tab's badge is drawn on the tab. The list of tabs that do not fit the strip, Quick-Open
and the minimized strip name the tab without it.

#### Scenario: The badge stands after the title

- **WHEN** a tab with a badge is shown in a strip that shows titles
- **THEN** the badge is drawn after the title, in its tone

#### Scenario: The badge is announced with the title

- **WHEN** a screen reader reaches a tab whose title is "Erweitert" and whose badge reads
  "Developer"
- **THEN** the tab's name is "Erweitert, Developer"

#### Scenario: The badge is not a stop of its own

- **WHEN** the user walks a strip with the keyboard
- **THEN** a tab with a badge is one stop, as a tab without one is

#### Scenario: A tab's own badge wins over the surface's

- **WHEN** a content tab was opened with a badge of its own and its surface declares another
- **THEN** the tab shows its own

#### Scenario: A strip of icons carries the badge in the tooltip

- **WHEN** a tab with a badge is shown in a strip that shows icons only
- **THEN** its tooltip and its accessible name carry the badge's text
