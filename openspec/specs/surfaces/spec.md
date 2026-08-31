# surfaces Specification

## Purpose
A plugin author declares one kind of thing — a surface — and the workbench decides where it can be
shown. This replaced an older arrangement where a docked view and an addressable screen were two
separate declarations that could not be moved between, and it is why a user can drag a sidebar view
into the main area and have it keep working.

## Requirements

### Requirement: One declaration covers everything the workbench can show

A plugin SHALL declare a surface once, and that declaration SHALL be the only author-facing entry
point for anything the workbench can display. Where the surface may appear is expressed as
properties of the declaration, not as a different kind of declaration.

#### Scenario: The same declaration serves a docked view and an addressable screen

- **WHEN** a plugin declares a surface with an address
- **THEN** it is reachable at that address
- **AND** it can also be mounted by the workbench outside its address, in a pane the user chose

### Requirement: A surface names how it is presented, and exactly one way

A surface SHALL declare its presentation as exactly one of: a component the workbench renders, a
component it loads on demand, an isolated document referenced by location, or an arrangement of
child surfaces. Declaring more than one SHALL be impossible.

#### Scenario: A deferred component is not loaded until it is shown

- **WHEN** a surface declares a component to be loaded on demand
- **THEN** the code for it is not fetched while the surface is unused

#### Scenario: An isolated surface is presented the same way wherever it is mounted

- **WHEN** a surface declared as an isolated document is mounted at its address, and again in a
  pane the user chose
- **THEN** both mounts present it as an isolated document

### Requirement: A surface declares where it may live, not where it sits

A surface SHALL declare the docks that can host it and whether it has an address. Where it actually
appears is the user's arrangement, not the declaration.

#### Scenario: A surface without an address must name a home

- **WHEN** a surface has no address and names no dock that could host it
- **THEN** the declaration is refused, because nothing could ever show it

#### Scenario: A surface that only ever appears inside another declares no home

- **WHEN** a surface declares an explicitly empty set of docks
- **THEN** it is never placed in a sidebar of its own
- **AND** it can still be shown as a child of a container

#### Scenario: An addressable surface may also be docked

- **WHEN** a surface declares both an address and a dock that can host it
- **THEN** both placements are available

### Requirement: A surface may own the whole content area

A surface with an address MAY declare that it owns the content area while it is shown. Such a
surface SHALL never become a tab, SHALL show no strip while it is active, and SHALL be excluded from
splitting and from dragging, because each of those presumes a tab that could be moved or reached
again. Whatever else is parked in the content area SHALL survive and reappear when the surface is
left.

This is for a screen that is not a document — a sign-in, an onboarding, an overview — and it is the
only presentation the user cannot rearrange, because there is nothing to arrange it beside.

#### Scenario: The screen shows no tab of its own

- **WHEN** a surface that owns the content area is shown
- **THEN** no tab is drawn for it, and no strip is drawn while it is active

#### Scenario: What was open is not lost

- **WHEN** the user leaves such a screen
- **THEN** the tabs that were open before it are shown again, as they were

#### Scenario: A workspace that declares one as a tab is told

- **WHEN** a workspace definition names a surface that owns the content area as one of its tabs
- **THEN** the developer is told that it will never render as a tab

### Requirement: A surface may exist several times over, under names the user gives

A surface MAY declare that it can exist as several independent named instances. Each instance
SHALL keep its own stored state, and the user SHALL be able to create, rename and remove them, with
one instance that cannot be removed.

#### Scenario: Two instances of one surface keep separate state

- **WHEN** the user creates a second named instance of a surface and changes something in it
- **THEN** the first instance is unaffected

#### Scenario: The default instance cannot be removed

- **WHEN** the user removes the instance they are looking at
- **THEN** the surface falls back to its default instance
- **AND** the default instance itself cannot be removed

### Requirement: A surface owns its edges unless something asks otherwise

The workbench SHALL apply no inset of its own. A surface SHALL fill the pane it is mounted in, at
every mount point, and what stands between its content and the pane edge SHALL be whatever the
surface itself draws.

A distribution MAY ask that everything it composes be inset, and a surface's own declaration SHALL
win over that default. The declaration SHALL work in both directions: a surface MAY ask to be inset
where the distribution asks for nothing, and MAY ask to be flush where the distribution asks for an
inset.

A surface's declaration SHALL travel with the surface, so it holds wherever the user puts it — the
content pane, a split, a sidebar, a pop-out window. Whether there is an inset is the contract; how
wide it is remains a matter of styling.

#### Scenario: A surface nothing was said about fills its pane

- **WHEN** a surface is shown and neither it nor the distribution asks for an inset
- **THEN** it fills the pane, with nothing applied by the workbench

#### Scenario: An edge-owning surface is flush in every pane

- **WHEN** a surface that owns its edges is shown at its address, and again in a secondary pane
- **THEN** it fills the pane in both, with no inset applied by the workbench

#### Scenario: An ordinary surface is inset consistently

- **WHEN** a distribution asks for an inset and a surface declares nothing
- **THEN** the workbench applies the same inset at every mount point
- **AND** a surface that declares its own is unaffected

#### Scenario: A surface asks to be inset where the product asks for nothing

- **WHEN** a surface declares that it wants an inset and the distribution asks for none
- **THEN** the workbench insets that surface and no other

### Requirement: The declaration carries the labels the workbench draws

A surface SHALL supply the title and icon the workbench uses wherever it names the surface — a tab,
a strip, a picker. A surface with an address MAY supply a different title for that address, and a
title MAY be given either as a translation key or as a literal.

#### Scenario: An address-specific title wins where it is given

- **WHEN** a surface supplies both a title and a separate title for its address
- **THEN** the address-specific one is used at the address, and the general one everywhere else

#### Scenario: A surface with no title of its own is not given an empty one

- **WHEN** a surface supplies no title for its address
- **THEN** the workbench leaves it without one rather than substituting an empty string

### Requirement: What a plugin registers can be projected back unchanged

The workbench SHALL keep one stored form for every surface, and any view of it that the workbench
derives SHALL be a filter over that one form. Registering a surface and reading it back SHALL yield
the same declaration.

#### Scenario: Reading back a registration does not alter it

- **WHEN** a surface is registered and then read back from the workbench
- **THEN** the declaration is unchanged, including the identity of the object where nothing moved
