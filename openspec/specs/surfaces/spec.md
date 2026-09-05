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

### Requirement: A surface is measured against its pane, not the window

The workbench SHALL offer every host-rendered surface the width of the pane it is mounted in as the
reference an adaptive layout resolves against, under a stable name the surface can refer to. The
surface SHALL NOT have to establish that reference itself, and a surface that establishes one of its
own SHALL keep it.

The reference SHALL follow the surface to every mount point, so a surface moved from the content
area into a sidebar, a split or a pop-out window is measured against wherever it now sits. It SHALL
track the pane as the pane changes, so splitting a pane, dragging a splitter or maximising re-lays
the surface out without it being remounted.

The guarantee holds for a surface the workbench renders. A surface presented as an isolated document
already measures against its own frame, which is the pane, and therefore needs nothing added.

#### Scenario: Splitting a pane re-lays out the surface inside it

- **WHEN** a surface whose layout adapts to available width is shown, and the user splits the pane
  it is in while the window keeps its size
- **THEN** the surface lays itself out for the narrower pane

#### Scenario: The same surface is measured differently in two panes at once

- **WHEN** one surface is shown in a wide pane and a second in a narrow pane beside it
- **THEN** each is laid out for the pane it is in, and neither follows the window

#### Scenario: A surface moved to a sidebar is measured against the sidebar

- **WHEN** the user moves an adaptive surface from the content area into a sidebar
- **THEN** it is measured against the sidebar it now sits in

#### Scenario: A surface that brought its own reference is not overridden

- **WHEN** a surface establishes a sizing reference of its own
- **THEN** its own reference continues to apply to its content

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

### Requirement: A surface may be renamed while it is mounted

A plugin SHALL be able to give a surface it registered a new title without registering it again, and
everywhere the workbench names that surface SHALL follow: its tab, the header of the panel it is
docked in, and any picker that lists it. The surface itself SHALL NOT be rebuilt, so what the user
has typed, scrolled or folded inside it survives the rename.

The limit of that: a rename reaches the name only. Where a surface is drawn, what it draws and every
other thing its declaration carries are unaffected, and a rename of an id nothing was registered
under changes nothing.

#### Scenario: The name follows wherever the surface is named

- **WHEN** a plugin renames a surface it registered
- **THEN** the panel header naming that surface shows the new title

#### Scenario: The surface keeps what the user did in it

- **WHEN** a surface is renamed while the user has state inside it
- **THEN** the surface is not rebuilt and that state is still there

#### Scenario: A name given as a key is still translated

- **WHEN** a surface is renamed with a translation key and the language changes
- **THEN** the new name is shown in the new language

#### Scenario: Renaming something that was never registered does nothing

- **WHEN** a plugin renames an id it did not register
- **THEN** nothing changes and nothing is drawn differently

### Requirement: What a plugin registers can be projected back unchanged

The workbench SHALL keep one stored form for every surface, and any view of it that the workbench
derives SHALL be a filter over that one form. Registering a surface and reading it back SHALL yield
the same declaration.

#### Scenario: Reading back a registration does not alter it

- **WHEN** a surface is registered and then read back from the workbench
- **THEN** the declaration is unchanged, including the identity of the object where nothing moved
