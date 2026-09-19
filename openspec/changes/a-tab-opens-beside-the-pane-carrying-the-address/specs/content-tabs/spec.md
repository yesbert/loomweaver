## ADDED Requirements

### Requirement: Content can open beside the pane carrying the address

Whoever opens content — a plugin on either runtime, or the distribution from its own code — SHALL
be able to ask for it to open beside the pane carrying the address instead of in it. The content
SHALL then open in the neighbouring pane, which is the pane that would take the address pane's place
if that pane were closed, and that pane SHALL show it. Where the main area is not split, the address
pane SHALL be split and the content SHALL open in the new pane to its right.

Opening beside SHALL NOT move the address: the pane that carried it keeps carrying it and keeps
showing what it showed, so that the next item opened beside lands in the same neighbour. Content
that is already open SHALL NOT be opened a second time; if it is open in the neighbouring pane, that
pane shows it. While the pane carrying the address is blown up to the whole area, opening beside
SHALL end the blow-up, so that what was opened is visible.

The request is subject to the distribution's switches: where splitting to the right has been
switched off, opening beside SHALL use a neighbour that already exists and SHALL NOT create one;
without a neighbour the content opens in the pane carrying the address, as it would without the
request. Opening beside requires nothing an ordinary open does not.

"Beside" is measured from the pane carrying the address at the moment of the request, not from the
surface that asks. A list the user clicks into has taken the address, so the guarantee holds for it.
It does not hold for a list the user reaches by keyboard alone, nor for a surface without an address
shown in a pane of its own, which never takes the address: what they open beside lands beside
whichever pane does carry it.

#### Scenario: A list opens its item beside itself

- **WHEN** a surface showing a list in the unsplit main area opens an item beside the pane carrying
  the address
- **THEN** the main area is split, the item is shown in the new pane on the right, and the list is
  still shown in its own pane
- **AND** the pane showing the list still carries the address

#### Scenario: The next item lands in the same neighbour

- **WHEN** the area is already split and a further item is opened beside the pane carrying the
  address
- **THEN** it opens in the neighbouring pane, and no further pane is created

#### Scenario: Content already open beside is shown, not duplicated

- **WHEN** an item already open in the neighbouring pane is opened beside again
- **THEN** that pane shows it, and no second tab for it appears anywhere

#### Scenario: With splitting switched off, nothing is split

- **WHEN** the distribution has switched splitting to the right off, the main area is not split, and
  content is opened beside the pane carrying the address
- **THEN** the area stays unsplit and the content opens in the pane carrying the address

#### Scenario: A blown-up pane makes room

- **WHEN** the pane carrying the address is blown up and content is opened beside it
- **THEN** the blow-up ends and the content is shown in the neighbouring pane

#### Scenario: A sandboxed plugin's request reaches the same opening

- **WHEN** a sandboxed plugin asks to open content beside the pane carrying the address
- **THEN** the request reaches the workbench with that wish intact and is handled by the same opening
  an in-process plugin reaches
- **AND** this is verified at the sandbox boundary; the end-to-end check drives a host-rendered list

## MODIFIED Requirements

### Requirement: One preview slot per pane, promoted only on purpose

A pane SHALL offer a single reused slot for transient content, so that browsing through many items
does not accumulate tabs. Opening content as a preview SHALL fill the slot of the pane it opens in:
the pane carrying the address, which is the pane the user last focused, or the neighbouring pane
when it is opened beside the pane carrying the address. A pane that gives up the address keeps its
preview, and its slot is filled again once it carries the address again or content is opened beside
it.

Promotion to a permanent tab SHALL be explicit; re-opening the same content SHALL NOT promote it,
because content commonly re-opens itself to refine its own title. Moving a preview into another pane
is such an explicit act: the preview SHALL arrive as a permanent tab, whichever pane it leaves and
whichever pane it joins, and whether it is moved by dragging, by its menu or by the keyboard. Moving
it to another place within its own strip SHALL NOT promote it. No pane SHALL ever hold more than one
preview.

#### Scenario: Browsing reuses one slot

- **WHEN** several items are opened as previews in turn
- **THEN** one tab is reused rather than one appearing per item

#### Scenario: A preview opens in the pane carrying the address

- **WHEN** the main area is split and an item is opened as a preview
- **THEN** it takes the preview slot of the pane carrying the address, and the other panes are
  unchanged

#### Scenario: Browsing beside a list reuses one slot beside it

- **WHEN** a list in the pane carrying the address opens several items in turn as previews beside
  that pane
- **THEN** one tab in the neighbouring pane is reused rather than one appearing per item
- **AND** the list's own pane gains no tab

#### Scenario: Promotion is a deliberate act

- **WHEN** the user asks to keep a preview
- **THEN** it becomes a permanent tab, and a further preview may open beside it

#### Scenario: Re-opening does not promote

- **WHEN** content already shown as a preview opens itself again
- **THEN** it stays a preview

#### Scenario: A preview moved to another pane arrives kept

- **WHEN** a preview is moved from one pane into another, whether or not either of them carries the
  address
- **THEN** it is a permanent tab in the pane it joined
- **AND** the next item opened as a preview does not replace it

#### Scenario: A pane never holds two previews

- **WHEN** a preview is moved onto the strip of a pane that already shows a preview
- **THEN** that pane holds one preview, the one it already had, and the moved tab is permanent

#### Scenario: Reordering within a strip keeps a preview

- **WHEN** a preview is moved to another position in its own strip
- **THEN** it is still a preview
