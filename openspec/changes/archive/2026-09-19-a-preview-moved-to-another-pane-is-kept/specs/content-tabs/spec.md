## MODIFIED Requirements

### Requirement: One preview slot per pane, promoted only on purpose

A pane SHALL offer a single reused slot for transient content, so that browsing through many items
does not accumulate tabs. Opening content as a preview SHALL fill the slot of the pane carrying the
address, which is the pane the user last focused; a pane that gives up the address keeps its
preview, and its slot is filled again once it carries the address again.

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
