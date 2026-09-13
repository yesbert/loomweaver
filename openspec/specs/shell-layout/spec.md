# shell-layout Specification

## Purpose
The workbench has a frame — bars, launcher rails, side panels and a content area — and a
distribution declares which of those it wants and where. The frame is the one part of the interface
the workbench draws itself; everything inside it arrives as a contribution.

## Requirements

### Requirement: A distribution declares its frame; the workbench renders it

A distribution SHALL declare its regions, each with an identity, a kind and a docking position, and
the workbench SHALL render exactly those. A region that is not declared SHALL not exist, and a
contribution aimed at it SHALL be reported rather than silently discarded.

The workbench SHALL supply a default frame, so that an application that declares nothing still has a
usable workbench.

#### Scenario: An undeclared region is not conjured up

- **WHEN** a distribution declares no launcher rail
- **THEN** the workbench draws none
- **AND** a contribution aimed at one is reported to the developer

#### Scenario: The default frame is complete enough to contribute to

- **WHEN** a distribution declares no layout of its own
- **THEN** the default frame includes the regions the workbench's own contributions target

### Requirement: Each kind of region has a fixed anatomy

Each kind of region SHALL have a fixed internal structure that plugins do not extend: a bar has
named slots, a launcher rail has an anchored top and bottom band, a panel has a header with actions
and a body, and the content area has its own strip and body. A plugin SHALL choose a region and a
slot within that fixed vocabulary, and SHALL NOT invent sub-slots.

#### Scenario: A contribution names a region and a place within its anatomy

- **WHEN** a plugin contributes to a bar
- **THEN** it names one of the bar's slots, and the workbench draws it there

#### Scenario: A contribution to the wrong kind of region is reported

- **WHEN** a plugin contributes an item to a region whose kind cannot hold it
- **THEN** the developer is told, naming the kind

### Requirement: A rail may show the names of its entries, and each rail is decided on its own

A rail SHALL be able to show each entry's name alongside its icon, and the user SHALL decide whether
it does. The decision SHALL be offered once per rail the frame declares, each offer carrying that
rail's own name, and SHALL start switched off. It SHALL survive a restart.

Where an entry's name is on screen, the workbench SHALL NOT repeat it as a tooltip. The limit of
that: a name the rail cannot show in full SHALL be shortened, and for a shortened name the tooltip
SHALL remain, because an entry the user cannot read is not identifiable by the name it was given.

#### Scenario: The user turns names on for one side only

- **WHEN** the frame declares a rail on each side and the user turns names on for one of them
- **THEN** the entries of that rail show their names
- **AND** the entries of the other rail do not

#### Scenario: A side that was never declared is not offered

- **WHEN** the frame declares a rail on one side only
- **THEN** exactly one decision is offered, under that rail's name

#### Scenario: The decision outlives the session

- **WHEN** the user turns names on and the application is started again
- **THEN** the names are still shown

#### Scenario: A name on screen is not also a tooltip

- **WHEN** an entry shows its name and the pointer rests on it
- **THEN** no tooltip repeats that name

#### Scenario: A name too long to show stays reachable

- **WHEN** an entry's name is longer than the rail can show
- **THEN** the name is shortened in place
- **AND** the full name is still available as a tooltip

### Requirement: A rail that holds more than fits scrolls, and its anchored band stays

Where a rail holds more entries than its height admits, the rail SHALL scroll, and every entry SHALL
be reachable without the user resizing the window. Entries SHALL NOT be clipped away unreachably.

The band anchored to the bottom SHALL stay in view while the entries above it scroll, so that what a
user reaches for last does not travel with what they are scrolling past.

#### Scenario: The last entry is reachable

- **WHEN** a rail holds more entries than its height admits
- **THEN** the entries above the anchored band can be scrolled
- **AND** the last of them can be brought into view

#### Scenario: The anchored band does not scroll away

- **WHEN** the entries of an overflowing rail are scrolled
- **THEN** the entries anchored to the bottom stay in view

#### Scenario: Keyboard focus brings its entry into view

- **WHEN** the keyboard moves focus to an entry that is scrolled out of view
- **THEN** that entry is brought into view

#### Scenario: A rail that fits is unchanged

- **WHEN** every entry of a rail fits its height
- **THEN** the rail looks and behaves as it did before

### Requirement: Both sides are symmetric

Where the frame offers a side, it SHALL offer both, with identical capabilities. Anything that can
be done on one side SHALL be possible on the other, and each side SHALL be distinguishable by name.

#### Scenario: A view can live on either side

- **WHEN** a view is contributed to a panel on either side
- **THEN** the same capabilities apply to it

### Requirement: A rail is named for its side only when there is another side

A rail SHALL carry one name, and everything the workbench says about that rail SHALL use it: the
name assistive technology announces for the region, and the name of any offer the workbench makes
about it. Where the frame declares more than one rail, that name SHALL say which side the rail is
on. Where it declares one, the name SHALL NOT, because there is no second rail to tell it apart
from.

#### Scenario: Two rails are told apart by their names

- **WHEN** the frame declares a rail on each side
- **THEN** the two names differ, and each says which side its rail is on

#### Scenario: A lone rail is not named for a side

- **WHEN** the frame declares one rail
- **THEN** its name says no side

#### Scenario: One name, wherever the rail is spoken of

- **WHEN** a rail is announced as a region and offered in the settings
- **THEN** both use the same name

### Requirement: A panel can be collapsed and resized, and remembers both

The user SHALL be able to collapse a panel and expand it again, and to change its width by dragging
or from the keyboard. Both SHALL survive a restart, the width SHALL be constrained to that panel's
usable range, and an unreadable stored value SHALL be ignored rather than propagated.

Every width the user releases SHALL be remembered as chosen, including a width equal to the panel's
default, so that the choice is kept if the panel's default later changes.

A collapsed panel on a side that has no launcher rail SHALL leave its column entirely, so the
content reaches the edge, and SHALL offer a way back.

#### Scenario: Width changes persist, and mid-drag changes do not

- **WHEN** the user drags a panel's edge
- **THEN** the width follows the pointer
- **AND** only the released width is remembered

#### Scenario: The width can be changed from the keyboard

- **WHEN** the panel's edge has focus
- **THEN** arrow keys change the width, a modifier makes the step coarser, and the extremes are
  directly reachable

#### Scenario: An unusable stored width does not strand the panel

- **WHEN** the stored width is unreadable or outside the panel's usable range
- **THEN** it is ignored or brought back into range

#### Scenario: A chosen width equal to the default outlasts a changed default

- **WHEN** the user releases a panel at exactly its default width
- **AND** the distribution later declares a different default for that panel
- **THEN** the panel opens at the width the user released

#### Scenario: A collapsed rail-less panel gives the space back

- **WHEN** a panel on a side without a launcher rail is collapsed
- **THEN** its column disappears and the content area extends into it
- **AND** a control to expand it again remains reachable

### Requirement: The frame belongs to the application, not to what is in it

A region SHALL be drawn because the distribution declared it, not because something currently
occupies it. A panel holding nothing SHALL stay as the application declared it rather than
collapsing itself.

#### Scenario: An empty panel does not fold itself away

- **WHEN** a declared panel holds no views
- **THEN** it stays in the state the application declared

### Requirement: The user curates what lives in each rail and sidebar

An item in a launcher rail and a view in a sidebar SHALL live in exactly one of them at a time, and
the user SHALL be able to move it to the other, reorder it among its neighbours, and hide it.
Every one of those SHALL be possible by pointer and from the keyboard, and each SHALL survive a
restart.

A checklist SHALL say which entries live here, including entries that currently live nowhere, so
that a hidden entry can be brought back.

#### Scenario: Moving a view to the other sidebar takes it out of the first

- **WHEN** the user moves a view to the opposite sidebar
- **THEN** it appears there and is gone from the one it came from

#### Scenario: A moved entry is not put back by the workbench

- **WHEN** the application restarts after a view was moved
- **THEN** it is still where the user put it, not where it was declared

#### Scenario: An entry that lives nowhere can be brought back

- **WHEN** a view has been hidden or dragged into the content area
- **THEN** the checklist still offers it, and choosing it places it in the sidebar whose checklist
  was used

#### Scenario: Re-showing an entry on its own side restores its neighbourhood

- **WHEN** a hidden view is shown again on the side it was declared for
- **THEN** it returns among its declared neighbours rather than at the end

#### Scenario: Reordering is possible without a pointer

- **WHEN** an entry has keyboard focus
- **THEN** it can be moved within its band and to the other side from the keyboard, and the result
  is announced

### Requirement: A declared view finds its way to a sidebar exactly once

The workbench SHALL place each declared view into its home sidebar when nothing already holds it,
and SHALL NOT place it again once the user has moved it. A view whose declaration disappears SHALL
be hidden rather than deleted, so that it returns if the declaration comes back.

Placement SHALL happen regardless of whether the current session qualifies for the view; whether it
is *drawn* is decided when it is drawn.

#### Scenario: A moved view is not re-seeded

- **WHEN** the user has moved a view into another dock and the application restarts
- **THEN** the workbench does not place a second copy in its declared home

#### Scenario: A view that vanished from everywhere comes home

- **WHEN** nothing holds a declared view any more
- **THEN** the workbench places it in its declared home again

#### Scenario: A gated view is placed before the session is known

- **WHEN** the workbench starts with no session yet and a view requires a role
- **THEN** the view is still placed
- **AND** it is not drawn until the session qualifies

#### Scenario: A view whose declaration is gone is kept, not discarded

- **WHEN** a stored arrangement names a view that no plugin declares any more
- **THEN** its place is hidden rather than removed

### Requirement: The frame adapts to a narrow viewport

On a viewport too narrow for side panels, the workbench SHALL keep the launcher rail and present a
panel as an overlay that can be dismissed, rather than shrinking the content away.

On that same viewport the workbench's own top-bar entries SHALL take a compact form: the product's
mark SHALL stand alone without the product's name, and the language switcher SHALL show the
language by its symbol without its name. The width at which this happens SHALL be the one at which
the side panels become overlays, so that a narrow viewport is one condition and not two, and a
tablet held upright counts as narrow.

What is compacted is presentation only. The product's name and the language's name SHALL remain
the accessible names of those entries, so that nothing is lost to a screen reader that a sighted
user can still infer from the mark.

#### Scenario: A narrow viewport keeps the content usable

- **WHEN** the viewport is too narrow for a side panel beside the content
- **THEN** the panel is presented over the content and can be dismissed
- **AND** the launcher rail remains

#### Scenario: The top bar's own entries compact on a narrow viewport

- **WHEN** the viewport is narrow enough for the side panels to be overlays
- **THEN** the product's mark is shown without its name
- **AND** the language switcher shows the language's symbol without its name
- **AND** the entries after them in the bar are within the viewport

#### Scenario: The compact entries keep their names for assistive technology

- **WHEN** the product's mark and the language switcher are shown in their compact form
- **THEN** each is still announced by its full name

#### Scenario: A wide viewport is unchanged

- **WHEN** the viewport is wide enough for a side panel beside the content
- **THEN** the product's name and the language's name are shown as before

### Requirement: A bar too narrow to show everything stays usable

Where a bar cannot show every entry contributed to it at that entry's natural width, the workbench
SHALL fold the entries that do not fit into a control at the end of the bar, and that control SHALL
present the folded entries so that each can still be read and used. An entry SHALL NOT be drawn
over another, and SHALL NOT be cut off at the bar's edge.

Entries SHALL fold from the end of the bar backwards, the entry nearest the fold control first, so
that what a product placed first stays visible longest; within a slot the entry that declared the
highest order folds first. An entry that may shorten itself, such as the product's name, SHALL be
given the room to do so, but shortening SHALL NOT stand in for folding: folding happens so that
every entry that remains in the bar is shown at its natural width.

Folding SHALL follow the bar's width as it changes, in both directions: an entry folded on a
narrow window SHALL return to the bar once the window is wide enough for it. A bar in which every
entry fits SHALL look and behave as it does today, with no fold control shown.

The limit of this guarantee is the bar: a folded entry is presented by the fold control in the
form it has, and the workbench makes no attempt to abbreviate an entry it did not draw. This was
verified for entries the workbench draws from a declaration and for entries a product renders
itself, in the host-rendered chrome.

#### Scenario: Entries that do not fit are folded, not overlapped

- **WHEN** the entries contributed to a bar are wider than the bar
- **THEN** the entries that do not fit are absent from the bar and a fold control is shown at its end
- **AND** no two entries in the bar overlap and none is cut off

#### Scenario: A folded entry is still reachable

- **WHEN** the user opens the fold control
- **THEN** every folded entry is presented and can be used as it could in the bar

#### Scenario: The last entry folds first

- **WHEN** a bar has to fold one entry
- **THEN** it is the entry nearest the bar's end, the one with the highest order in the end slot

#### Scenario: Folding follows the width

- **WHEN** the window widens enough for a folded entry to fit
- **THEN** that entry returns to the bar, and the fold control disappears once nothing is folded

#### Scenario: A bar that fits is unchanged

- **WHEN** every entry of a bar fits its width
- **THEN** no fold control is shown and the bar looks and behaves as it did before

### Requirement: A chrome entry may be drawn as a picture of what it stands for

An entry contributed to a rail, and a button contributed to a bar, MAY carry a picture of what it
stands for, and the workbench SHALL draw that picture in its place. Where the entry carries none, or where the one it carries cannot be
shown, the workbench SHALL fall back to the short mark the entry declares, and to its icon where it
declares no mark. Falling back SHALL be the workbench's own doing, so a product that declares a
picture never has to handle the picture's absence, which is the ordinary case rather than the
exception.

Where the workbench draws a short mark in place of a picture — in a rail entry, in a bar button, in
a menu heading — the mark SHALL take the shape the picture takes in that place, at the same size, so
that the two alternatives for one slot read as the same kind of thing. Where the same letters are
drawn in a list rather than in such a slot, they SHALL keep their plain form.

The picture SHALL be decoration: the entry SHALL still be announced by its title, so that what the
picture stands for is not read a second time.

Whether a picture can be fetched at all SHALL stay the product's business, since the workbench
neither serves it nor knows where it comes from.

#### Scenario: An entry stands for a person and shows their picture

- **WHEN** a rail entry or a bar button carries a picture and it can be shown
- **THEN** the picture is drawn in place of the entry's icon and its short mark

#### Scenario: A picture that cannot be shown gives way

- **WHEN** the picture such a control carries fails to load
- **THEN** the control draws its short mark instead, or its icon where it declares no mark
- **AND** the control stays usable, with no broken image in the chrome

#### Scenario: The mark stands where the picture would have stood

- **WHEN** a rail entry or a bar button draws its short mark because it carries no picture
- **THEN** the mark is drawn in the same shape and size the picture would have had

#### Scenario: The same letters in a list are left plain

- **WHEN** the workbench draws a short mark in a list rather than in a chrome slot
- **THEN** the letters are drawn plain, without the slot's shape

#### Scenario: The picture is not announced

- **WHEN** assistive technology reaches an entry drawn as a picture
- **THEN** the entry is announced by its title, and the picture adds nothing to that

### Requirement: The sidebars are reachable to the distribution

The distribution SHALL be able to do with the sidebars, from its own code, what the sidebar header,
the splitter and the view menu do: collapse a panel, expand it, toggle it, set its width, hide a view
and show a view again, naming the panel by the region id it declared and the view by the id it
registered. Each action SHALL be the same action the control performs, with the same guards and the
same outcome: a width set from code SHALL be brought into that panel's usable range and remembered
like a released drag, and hiding a view SHALL ask about unsaved work exactly as the view menu does. A
region id that names no declared panel SHALL do nothing.

These actions SHALL stay available while the distribution has switched the corresponding sidebar
capabilities off for its users.

#### Scenario: A distribution's own control collapses a panel

- **WHEN** a component the distribution wrote collapses a declared panel
- **THEN** the panel collapses exactly as from its header, and the state survives a restart

#### Scenario: A width set from code is clamped and remembered

- **WHEN** the distribution sets a panel's width to a value outside that panel's usable range
- **THEN** the width is brought into range and remembered as a released drag would be

#### Scenario: Hiding a view from code asks like the menu

- **WHEN** the distribution hides a view whose surface holds unsaved work
- **THEN** the same question is asked that the view menu would ask, and the view is hidden only if
  the answer allows it

#### Scenario: An unknown region does nothing

- **WHEN** the distribution names a region id no declared panel carries
- **THEN** nothing changes

#### Scenario: Reachable while switched off

- **WHEN** the distribution has switched collapsing off and collapses a panel from its own code
- **THEN** the panel collapses, and the user is offered no collapse control

### Requirement: The sidebars are readable as facts

The distribution SHALL be able to read the sidebars as reactive values: the declared panel regions,
whether each is collapsed and how wide it is, and which views are hidden. A reader that depends on
one of these re-evaluates when it changes.

#### Scenario: A distribution's own control follows a collapse

- **WHEN** a distribution binds its own control to whether a panel is collapsed and the user
  collapses it from the header
- **THEN** the control re-renders as collapsed without further wiring

#### Scenario: The hidden views are listed

- **WHEN** the user hides a view from the menu and the distribution reads the hidden views
- **THEN** that view's id is among them, and it is gone once the view is shown again

### Requirement: A panel region may declare its own widths

A distribution SHALL be able to declare, for each panel region, the width the panel starts at and
the narrowest and widest the panel may be made. Each of the three SHALL be optional, and one that is
not declared SHALL take the workbench's own value, so that a panel declaring none behaves as every
panel does today.

The declared start width SHALL be what the panel shows until the user resizes it, and what resetting
the application's layout returns it to. The declared bounds SHALL constrain every way the width is
set for that panel: dragging, the keyboard, a width set from code, and a stored width, which is
brought into the current bounds when it is read. The bounds of one panel SHALL NOT affect another.

Widths SHALL be declarable on panel regions only. A declaration whose narrowest width exceeds its
widest, or whose start width lies outside its own bounds after the workbench's values are filled in,
SHALL be refused when the distribution is composed, with a message naming the region.

The declared widths apply where a panel stands beside the content. On a viewport narrow enough for a
panel to be presented as an overlay, the overlay keeps its own width.

#### Scenario: A panel starts at its declared width

- **WHEN** a distribution declares a start width for a panel and the user has never resized it
- **THEN** the panel opens at the declared width

#### Scenario: A panel declaring nothing is unchanged

- **WHEN** a panel region declares no widths
- **THEN** it starts, and may be resized, exactly as a panel does without this declaration

#### Scenario: Declared bounds constrain every way of setting the width

- **WHEN** a panel declares a narrowest and a widest width
- **THEN** dragging, the keyboard's extremes and a width set from code all stay within them

#### Scenario: A width stored under wider bounds is brought into the new ones

- **WHEN** a width was remembered for a panel and the distribution later declares a widest width
  below it
- **THEN** the panel opens at its new widest width

#### Scenario: One panel's bounds leave another's alone

- **WHEN** one panel declares bounds and another declares none
- **THEN** the other panel keeps the workbench's own bounds

#### Scenario: Resetting the layout returns to the declared start width

- **WHEN** the user resets the application's layout
- **THEN** a panel with a declared start width shows that width immediately, without a reload

#### Scenario: Contradictory widths are refused

- **WHEN** a panel region declares a narrowest width above its widest, or a start width outside its
  own bounds
- **THEN** the distribution is refused at composition time with a message naming the region

#### Scenario: A narrow viewport keeps the overlay's width

- **WHEN** the viewport is narrow enough for panels to be overlays
- **THEN** a panel with declared widths is presented at the overlay's own width
