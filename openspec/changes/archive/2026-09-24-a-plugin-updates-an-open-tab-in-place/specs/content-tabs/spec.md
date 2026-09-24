## ADDED Requirements

### Requirement: An open tab's label may be changed where it stands

A plugin SHALL be able to change the title, icon and badge of a content tab that is open, without
opening it again. The tab SHALL take what the change gives as its own label, keep what the change
leaves out, and lose its own badge where the change takes it away; a label changed this way SHALL be
kept like one the tab was opened with.

The change SHALL reach the tab in whichever pane of the main area it stands, the pane carrying the
address or another, and SHALL NOT bring the tab forward, move the focus or change the address. This
SHALL hold for a plugin that runs isolated from the workbench as it does for one that runs in the
page.

The limit: the change reaches an open tab only. For content with no open tab it changes nothing and
opens nothing, and a change for content another plugin registered changes nothing.

#### Scenario: A tab behind another follows without coming forward

- **WHEN** a plugin changes the badge of an open tab that is not the one in front
- **THEN** that tab shows the new badge, and the tab in front, the focus and the address stay as they
  were

#### Scenario: A tab in another pane follows

- **WHEN** a plugin changes the title of an open tab that stands in a pane other than the one
  carrying the address
- **THEN** that tab shows the new title where it stands

#### Scenario: What the change leaves out stays

- **WHEN** a plugin changes only the badge of a tab that has a title of its own
- **THEN** the tab keeps its title and shows the new badge

#### Scenario: A changed label survives a restart

- **WHEN** a plugin changes the title of an open tab and the application restarts
- **THEN** the tab shows the changed title

#### Scenario: Content with no open tab is left alone

- **WHEN** a plugin changes the label of content that has no open tab
- **THEN** no tab opens and nothing else changes

#### Scenario: Another plugin's tab is left alone

- **WHEN** a plugin changes the label of a tab whose content another plugin registered
- **THEN** nothing changes
