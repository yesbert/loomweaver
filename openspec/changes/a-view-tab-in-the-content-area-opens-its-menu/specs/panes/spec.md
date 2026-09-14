## MODIFIED Requirements

### Requirement: A pane is one kind of thing everywhere

Every place the workbench can show work SHALL be a pane of the same kind, holding a group of open
items with one of them showing. This SHALL hold in the main area and in a sidebar, so that the same
gestures apply in both and work can move between them.

A view's tab SHALL offer the view's menu on the right-click wherever the tab stands: in a sidebar,
in a split pane of the main area, and in the main area when it is a single pane. The menu SHALL
carry the workbench's own entries for the view and any entry a plugin contributes for it, and the
entries that act on the view's region SHALL act on the region the tab stands in.

#### Scenario: A sidebar pane and a main-area pane behave alike

- **WHEN** work is moved from a sidebar into the main area, and back
- **THEN** it is shown in both, and the gestures available to it are the same

#### Scenario: A view's tab offers its menu in the unsplit main area

- **WHEN** a view has been moved into the main area while the area is a single pane, and the user
  right-clicks its tab
- **THEN** the view's menu opens with the workbench's entries for the view and any plugin entry
  contributed for it, the same menu the tab offers in a split pane of the main area
- **AND** a content tab beside it keeps the content tab's own menu
