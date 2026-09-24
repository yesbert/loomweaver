## MODIFIED Requirements

### Requirement: A tab may carry a badge beside its title

A tab SHALL show a badge where it has one: its own, given when it was opened, or else the badge of
the surface it shows. In a strip that shows titles, the badge SHALL stand after the title, drawn in
the tone it names, and SHALL NOT be a control of its own, so the tab stays a single stop for the
keyboard. The badge's text SHALL be part of the tab's accessible name, after the title and before
any word about unsaved work, so a screen reader announces "Erweitert, Developer" rather than the
title alone.

A tab's own badge MAY be taken away again; the surface's badge then shows, where it has one. In a
strip that shows icons only, there is no room for text beside an icon; the badge's text SHALL then
be part of the tab's tooltip and accessible name, and a badge that is an icon alone is not shown
there.

Where a tab in a strip that shows titles is too narrow for its title and its badge, the title SHALL
come first: the badge SHALL give way before the title is shortened, narrowing to a mark in its tone
with its text cut. The tooltip of a tab in a strip that shows titles SHALL carry the badge's text
after the title, as its accessible name does, so a badge that has given way can still be read.

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

#### Scenario: A tab's own badge can be taken away

- **WHEN** a content tab carrying a badge of its own is opened again with its badge taken away
- **THEN** the tab shows the surface's badge, or none where the surface has none

#### Scenario: A strip of icons carries the badge in the tooltip

- **WHEN** a tab with a badge is shown in a strip that shows icons only
- **THEN** its tooltip and its accessible name carry the badge's text

#### Scenario: A narrow tab keeps its title before its badge

- **WHEN** a tab with a badge stands in a strip that shows titles and is too narrow for both
- **THEN** the badge narrows to a mark in its tone before the title is shortened

#### Scenario: The tooltip of a tab in a strip of titles carries the badge

- **WHEN** the user points at a tab with a badge in a strip that shows titles
- **THEN** its tooltip shows the title followed by the badge's text
