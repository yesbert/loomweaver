## ADDED Requirements

### Requirement: A tab's menu offers only the entries that can act where the tab stands

The entries of a tab's menu that take the tab or its work somewhere SHALL be offered only where
they can do so, and SHALL be absent otherwise rather than drawn and dead. A content tab SHALL be
offered the entries that split it out into a new pane only while other tabs share its pane, since a
tab alone would leave its pane empty; the pane's own split control remains the way to split a lone
tab. A view's tab SHALL be offered the entries that bring it into the main area or move it to the
other sidebar only while it stands outside the main area. The entries that copy a view on purpose,
reset it, open it in a window or hide it SHALL stay wherever the tab stands.

A tab's menu context SHALL say whether the tab is alone in its pane and, for a view, whether it
stands in the main area, so that an entry a plugin contributes can make the same distinctions.

#### Scenario: A lone content tab is not offered a split it cannot make

- **WHEN** a content tab is the only tab in the address-carrying pane and the user opens its menu
- **THEN** the split entries are absent, and the pane toolbar still offers to split
- **AND** with a second tab in the pane the split entries are offered and split the chosen tab out

#### Scenario: A view in the main area is not offered the sidebar's moves

- **WHEN** a view's tab stands in a pane of the main area and the user opens its menu
- **THEN** the entries that open it in the main area and that move it to the other sidebar are
  absent, and stacking, resetting, opening in a window and hiding are offered
- **AND** on the same view's tab in a sidebar both entries are offered as before
