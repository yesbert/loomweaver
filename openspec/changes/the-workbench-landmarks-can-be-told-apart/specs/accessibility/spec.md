## MODIFIED Requirements

### Requirement: The workbench's structure is announced, not just drawn

The workbench SHALL expose its regions as landmarks, its tab strips as real tab lists, and its
transient messages as live regions, so that the structure a sighted user sees is available to a
screen reader. Where two regions are of the same kind, each SHALL be distinguishable by name.

The landmarks SHALL be these, each named in the interface language:

- the row of bars at the top edge as one banner, and the row at the bottom edge as one content-info
  region, however many bars a distribution declares there; a single bar is not a landmark of its own;
- the rail as navigation;
- each side panel as a complementary region;
- the content area as the one main region, holding every pane and every tab strip in it, however it
  is split.

Each pane's body SHALL be a tab panel named by its active tab, and each tab SHALL identify the panel
it controls. This holds in the content area and in the side panels alike.

The limit: where a side panel's header is drawn in the top row rather than beside the panel, its tab
strip lies in the banner and not in the panel's complementary region.

#### Scenario: Two sidebars are told apart

- **WHEN** the workbench draws a panel on each side
- **THEN** each carries its own accessible name

#### Scenario: A transient message is announced

- **WHEN** the workbench raises a notice
- **THEN** it is announced, with urgency matching the kind of notice

#### Scenario: Bars at both edges are not two banners

- **WHEN** a distribution declares a bar at the top edge and one at the bottom edge
- **THEN** the document has one banner and one content-info region, each named

#### Scenario: Several bars at one edge are still one landmark

- **WHEN** a distribution declares two bars at the top edge
- **THEN** the document has one banner, and each bar inside it is a named group

#### Scenario: A split content area is one main region

- **WHEN** the content area is split into two panes
- **THEN** both panes, their surfaces and their tab strips lie inside the one main region

#### Scenario: A surface is named by the tab it is opened under

- **WHEN** a pane shows a surface under its active tab
- **THEN** the pane's body is a tab panel carrying that tab's name
- **AND** the tab identifies that panel as the one it controls

#### Scenario: A side panel's strip lies in its region

- **WHEN** a side panel is drawn with its header beside it
- **THEN** its tab strip lies inside the panel's complementary region

#### Scenario: The landmark audit passes over a split workbench

- **WHEN** the automated audit's landmark rules run over a workbench with bars at both edges, a panel
  on each side and a split content area
- **THEN** no landmark is reported as duplicated, unnamed among its kind, or missing, and no content
  is reported outside every landmark
