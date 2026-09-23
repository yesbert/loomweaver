## MODIFIED Requirements

### Requirement: The declaration carries the labels the workbench draws

A surface SHALL supply the title and icon the workbench uses wherever it names the surface — a tab,
a strip, a picker. A surface with an address MAY supply a different title for that address, and a
title MAY be given either as a translation key or as a literal.

A surface MAY also supply a badge: a short mark such as "Beta" or "Developer", given as a text, an
icon or both, in one of the tones the workbench's badges have. The workbench SHALL draw it on every
tab that shows the surface, beside the title. Its text MAY be a translation key or a literal, as a
title may.

#### Scenario: An address-specific title wins where it is given

- **WHEN** a surface supplies both a title and a separate title for its address
- **THEN** the address-specific one is used at the address, and the general one everywhere else

#### Scenario: A surface with no title of its own is not given an empty one

- **WHEN** a surface supplies no title for its address
- **THEN** the workbench leaves it without one rather than substituting an empty string

#### Scenario: A declared badge is drawn on the surface's tabs

- **WHEN** a surface declares a badge and is shown as a tab
- **THEN** the tab shows the badge beside its title

## ADDED Requirements

### Requirement: A surface's badge may be changed while it is mounted

A plugin SHALL be able to give a surface it registered a badge, replace it or take it away without
registering the surface again, and every tab that shows that surface SHALL follow. The surface itself
SHALL NOT be rebuilt, so what the user has typed, scrolled or folded inside it survives the change.
This SHALL hold for a plugin that runs isolated from the workbench as it does for one that runs in
the page.

The limit of that: a change of badge reaches the badge only, and a change for an id nothing was
registered under changes nothing.

#### Scenario: Every tab showing the surface follows

- **WHEN** a plugin gives a mounted surface a badge
- **THEN** each tab that shows the surface shows the badge, and the surface is not rebuilt

#### Scenario: A badge can be taken away

- **WHEN** a plugin takes the badge of a surface away
- **THEN** its tabs show the title alone

#### Scenario: A badge given as a key is still translated

- **WHEN** a surface's badge text is a translation key and the language changes
- **THEN** the badge is shown in the new language

#### Scenario: Changing the badge of something never registered does nothing

- **WHEN** a plugin changes the badge of an id it did not register
- **THEN** nothing changes and nothing is drawn differently
