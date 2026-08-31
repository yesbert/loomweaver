## RENAMED Requirements

- FROM: `### Requirement: A surface may own its own edges`
- TO: `### Requirement: A surface owns its edges unless something asks otherwise`

## MODIFIED Requirements

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
