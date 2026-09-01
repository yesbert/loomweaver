# content-tabs Specification

## Purpose
Work that is open appears as a strip of tabs on the pane holding it. A tab is not simply a bookmark:
it has a lifetime the user controls, from a transient preview through an ordinary tab to one pinned
in place, and the workbench's job is to make those transitions predictable and never lose work in
one of them.

## Requirements

### Requirement: A pane shows everything it holds, and nothing it does not

A pane SHALL show a strip listing every item it holds, whatever kind they are, and SHALL show no
strip while it holds nothing. The strip SHALL NOT filter by any grouping: what is open is visible.

#### Scenario: Items of different kinds share one strip

- **WHEN** a pane holds items contributed by different plugins and of different kinds
- **THEN** all of them appear side by side in one strip

#### Scenario: A pane holding nothing shows no strip

- **WHEN** a pane holds no items
- **THEN** no strip is drawn

### Requirement: Visiting content opens a tab for it, unless it declines one

Reaching content by any route — a link, the address bar, a command, a plugin's request — SHALL open
a tab for it if none is open, and SHALL otherwise refine the existing one rather than opening a
second. Content MAY declare that it is not a tab, in which case it occupies the pane without a strip;
the starting screen is never a tab.

#### Scenario: A deep link opens its tab

- **WHEN** the application is opened directly at an address
- **THEN** a tab for it appears, and it survives the arrangement being restored

#### Scenario: Re-reaching open content does not duplicate it

- **WHEN** content that is already open is reached again
- **THEN** the existing tab is used, and its title may be refined

#### Scenario: Content below an open tab lands on that tab

- **WHEN** an address below an open tab's own address is reached
- **THEN** it is shown in that tab rather than opening a second one

#### Scenario: Full-screen content takes no tab

- **WHEN** content declares that it is not a tab
- **THEN** it fills the pane and no strip is drawn for it

### Requirement: One preview slot per pane, promoted only on purpose

A pane SHALL offer a single reused slot for transient content, so that browsing through many items
does not accumulate tabs. Promotion to a permanent tab SHALL be explicit; re-opening the same
content SHALL NOT promote it, because content commonly re-opens itself to refine its own title.

#### Scenario: Browsing reuses one slot

- **WHEN** several items are opened as previews in turn
- **THEN** one tab is reused rather than one appearing per item

#### Scenario: Promotion is a deliberate act

- **WHEN** the user asks to keep a preview
- **THEN** it becomes a permanent tab, and a further preview may open beside it

#### Scenario: Re-opening does not promote

- **WHEN** content already shown as a preview opens itself again
- **THEN** it stays a preview

### Requirement: A pinned tab is anchored and protected

The user SHALL be able to pin a tab, which anchors it ahead of the unpinned ones and protects it
from bulk closing. Pinning something transient SHALL make it permanent in the same act, and
unpinning SHALL return it to the front of the unpinned ones.

#### Scenario: Pinning anchors a tab ahead of the rest

- **WHEN** a tab is pinned
- **THEN** it sorts ahead of the unpinned tabs, and each band keeps its own order

#### Scenario: Pinning something transient makes it permanent

- **WHEN** a preview tab is pinned
- **THEN** it is no longer transient

#### Scenario: A pinned tab survives bulk closing

- **WHEN** the user closes all tabs, or all but one
- **THEN** pinned tabs remain

### Requirement: Closing in bulk spares what must not go

The user SHALL be able to close the other tabs, all of them, or those after a given one. Each SHALL
spare pinned tabs and any tab the arrangement declares unclosable.

#### Scenario: Closing the others keeps the target and the pinned ones

- **WHEN** the user closes all tabs but one
- **THEN** that tab and every pinned tab remain

#### Scenario: A tab declared unclosable is never closed in bulk

- **WHEN** a bulk close would include a tab the arrangement declares unclosable
- **THEN** it remains

### Requirement: Closing runs the owner's teardown exactly once

Where content asked to be told when its tab closes, the workbench SHALL tell it exactly once, and
only once the tab has really gone. A refusal or a failure while closing SHALL NOT leave the tab in
place nor raise an unhandled failure.

#### Scenario: Teardown runs once, on the real close

- **WHEN** a tab with a registered teardown is closed
- **THEN** the teardown runs once

#### Scenario: Merely staying open does not run it

- **WHEN** a tab with a registered teardown stays open across other changes
- **THEN** the teardown does not run

#### Scenario: A failure while closing still closes the tab

- **WHEN** the navigation that accompanies a close fails
- **THEN** the tab is still removed and the failure is reported rather than left unhandled

### Requirement: The user orders the tabs of a pane, and the order sticks to that pane

The user SHALL be able to reorder tabs within their band, by drag and from the keyboard, and the
order SHALL belong to the pane holding them rather than to the work area as a whole. It SHALL
survive a restart, SHALL leave a newly opened tab at its natural place, and SHALL silently forget
tabs that are gone.

#### Scenario: Reordering one pane leaves another alone

- **WHEN** the user reorders the tabs of one pane
- **THEN** another pane's order is unchanged

#### Scenario: Reordering does not cross a band

- **WHEN** the user moves a tab at the edge of its band further in that direction
- **THEN** it stays where it is

#### Scenario: A newly opened tab is not put at the end of a remembered order

- **WHEN** a tab that the remembered order does not know about is opened
- **THEN** it appears at its natural position

#### Scenario: Reordering is possible from the keyboard, and announced

- **WHEN** a tab has focus and the user asks to move it
- **THEN** it moves within its band and the new position is announced

### Requirement: A strip too narrow to show everything stays usable

Where a pane is too narrow, tabs SHALL shrink and then be clipped rather than the strip scrolling
away from the user. Everything open SHALL remain reachable from a control that lists it, and
choosing a clipped tab SHALL bring it into view.

A strip SHALL NOT rearrange itself because of a click on a tab that is already fully visible.

#### Scenario: Everything open stays reachable when clipped

- **WHEN** more tabs are open than the pane can show
- **THEN** a control lists every open tab, and choosing one activates it

#### Scenario: Choosing a clipped tab brings it into view

- **WHEN** a tab that is not visible is activated
- **THEN** it is moved to the front of its band so that it can be seen

#### Scenario: Clicking a visible tab does not reshuffle the strip

- **WHEN** the user clicks a tab that is already fully visible
- **THEN** the order is unchanged

### Requirement: Open work is findable across every pane

The user SHALL be able to search everything open across all panes and reach it. Choosing a result
SHALL activate it **where it already is**, rather than opening a copy in the pane that had focus.

#### Scenario: A result in another pane is activated in place

- **WHEN** the user chooses a search result held by another pane
- **THEN** that pane shows it, and no second copy appears

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

