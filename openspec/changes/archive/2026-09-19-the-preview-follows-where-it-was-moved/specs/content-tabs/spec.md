## RENAMED Requirements

- FROM: `### Requirement: One preview slot per pane, promoted only on purpose`
- TO: `### Requirement: One preview in the main area, wherever it was moved, promoted only on purpose`

## MODIFIED Requirements

### Requirement: One preview in the main area, wherever it was moved, promoted only on purpose

The main area SHALL hold at most one preview: a single reused tab for transient content, so that
browsing through many items does not accumulate tabs. Opening content as a preview SHALL replace that
preview in place, in whichever pane of the main area it stands; that pane SHALL then carry the
address, and the address SHALL name the new content. Where the main area holds no preview, the new
one SHALL open in the pane carrying the address.

Moving a preview to another pane of the main area, whether by dragging, by its menu or by the
keyboard, SHALL keep it a preview. Moving it into a sidebar SHALL make it a permanent tab, because a
sidebar holds no preview.

Promotion to a permanent tab SHALL be explicit; re-opening the same content SHALL NOT promote it,
because content commonly re-opens itself to refine its own title.

#### Scenario: Browsing reuses one slot

- **WHEN** several items are opened as previews in turn
- **THEN** one tab is reused rather than one appearing per item

#### Scenario: A preview dragged to another pane stays a preview

- **WHEN** a preview is dragged from the pane carrying the address into another pane of the main
  area, onto its strip or onto an edge
- **THEN** it is still a preview in the pane it joined
- **AND** that pane carries the address, which still names the same content

#### Scenario: The next preview replaces it where it stands

- **WHEN** the preview stands in one pane, the user focuses another pane showing a list, and opens a
  further item from that list as a preview
- **THEN** the preview in the first pane shows the new item, in the same place in its strip
- **AND** that pane carries the address, which names the new item
- **AND** the pane showing the list still shows it and gains no tab

#### Scenario: Without a preview, the pane carrying the address gets one

- **WHEN** no pane of the main area holds a preview and an item is opened as a preview
- **THEN** it opens in the pane carrying the address

#### Scenario: A preview moved into a sidebar becomes permanent

- **WHEN** a preview is moved from the main area into a sidebar
- **THEN** it is a permanent tab there
- **AND** the next item opened as a preview does not replace it

#### Scenario: Promotion is a deliberate act

- **WHEN** the user asks to keep a preview
- **THEN** it becomes a permanent tab, and a further preview may open beside it

#### Scenario: Re-opening does not promote

- **WHEN** content already shown as a preview opens itself again
- **THEN** it stays a preview
