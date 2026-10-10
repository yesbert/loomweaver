# accessibility Specification

## Purpose
Accessibility is a property of the workbench rather than of each plugin, because the workbench draws
almost all of the chrome. A plugin that contributes declaratively and uses the host's own building
blocks therefore inherits the guarantee, and this capability states what exactly it inherits.

## Requirements

### Requirement: The workbench meets WCAG 2.1 Level AA

The chrome the workbench draws SHALL conform to WCAG 2.1 Level AA. Conformance SHALL be checked
by an automated audit over the workbench's principal screens and states, which runs as part of the
end-to-end suite.

#### Scenario: The principal screens pass an automated audit

- **WHEN** the automated accessibility audit runs over the workbench's principal screens in both
  light and dark appearance, and with a dialog, a menu and a populated tab strip open
- **THEN** no violation at level A or AA is reported

#### Scenario: The audit's own limits are not mistaken for coverage

- **WHEN** the automated audit passes
- **THEN** that establishes only what a machine can check — names, contrast, roles and relationships
- **AND** focus order, keyboard reach and screen-reader sense remain to be checked by a person

### Requirement: Every colour pairing the workbench ships meets the contrast bar

The semantic colour tokens SHALL be defined so that any pairing the workbench uses meets the AA
contrast ratio, in both light and dark appearance. Where a brand colour cannot meet it, the
workbench SHALL carry separate tokens for the readable variants rather than lowering the bar.

#### Scenario: Brand identity does not force an unreadable pairing

- **WHEN** a brand colour is too light to carry text at the required ratio
- **THEN** the workbench uses a separate token for text and for filled surfaces
- **AND** the brand colour itself is still used where contrast does not apply

### Requirement: Everything reachable by pointer is reachable by keyboard

Every gesture the workbench offers SHALL have a keyboard route. Where a gesture is a drag, the
keyboard equivalent SHALL exist and SHALL announce its result, so that a user who cannot drag is not
excluded from arranging their work.

#### Scenario: Rearranging is possible without a pointer

- **WHEN** a user moves a tab, a docked view or a launcher item using the keyboard
- **THEN** the move happens
- **AND** the result is announced to assistive technology

#### Scenario: Closing and promoting a tab is possible without a pointer

- **WHEN** a tab has keyboard focus
- **THEN** it can be closed from the keyboard
- **AND** the key that does so is announced on the tab itself

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

The limit: a transient message is announced by whoever draws it. Where a distribution draws notices
itself, the workbench exposes no live region for them, and announcing them with an urgency matching
their kind is the distribution's.

#### Scenario: Two sidebars are told apart

- **WHEN** the workbench draws a panel on each side
- **THEN** each carries its own accessible name

#### Scenario: A transient message is announced

- **WHEN** a notice is raised and the workbench draws notices
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

### Requirement: A surface that opens in more than one mode is named for the mode it is in

Where the workbench opens one surface in more than one mode, the accessible name it presents SHALL
describe the mode it opened in, so that what a screen reader announces is what actually opened. This
holds for the container and for the control that receives focus inside it: neither SHALL be left
unnamed, and neither SHALL carry the name of a mode other than the current one.

A placeholder SHALL NOT be relied on to carry this distinction. It is announced inconsistently
across screen readers and it disappears as soon as the user types, so it cannot be the only thing
that says which of two searches is open.

The limit of this guarantee: it is not established by the automated audit, which reports a control
named for the wrong thing as correctly named. It SHALL therefore rest on a test that asserts the
name against the mode.

#### Scenario: The search over open work announces itself as that

- **WHEN** the user opens the search over open work
- **THEN** the name it presents describes searching open work, and not searching commands

#### Scenario: The command search still announces itself as that

- **WHEN** the user opens the command search
- **THEN** the name it presents describes searching commands

#### Scenario: The distinction does not rest on the placeholder

- **WHEN** the user has typed into either search, so that no placeholder is shown
- **THEN** the name still describes the mode that is open

### Requirement: A tab strip stays a valid tab list

Because a tab is announced as a tab, it cannot contain another focusable control. Affordances drawn
inside a tab — closing it, unpinning it — SHALL therefore not be focusable, and their function
SHALL be reachable from the keyboard by another route.

A tab strip SHALL also behave as the tab list it is announced as. It SHALL be a single stop in the
focus order: moving focus into it SHALL land on its selected tab, and moving focus on SHALL leave
it. Within it, the left and right arrow keys SHALL move the focus to the previous and next tab,
wrapping at either end, and Home and End SHALL move it to the first and the last tab. Moving the focus SHALL NOT choose a tab; Enter or Space SHALL choose the
focused one. This SHALL hold for every tab strip the workbench draws.

The limits of that: a key pressed with a modifier keeps the meaning the workbench gives it elsewhere,
such as reordering or moving, and a distribution cannot make the focus choose the tab.

#### Scenario: The close affordance is not a second focus stop

- **WHEN** a user walks a populated tab strip with the arrow keys
- **THEN** focus lands on each tab and not on the affordances drawn inside them

#### Scenario: A strip is one stop in the focus order

- **WHEN** a strip holds several tabs and the user moves focus into it and then on
- **THEN** focus lands on the selected tab, and the next move leaves the strip

#### Scenario: The arrow keys walk the strip without choosing

- **WHEN** a tab in a strip has focus and the user presses the right arrow key
- **THEN** the next tab has focus, and the tab that was selected is still selected
- **AND** on the last tab the right arrow key moves the focus to the first

#### Scenario: Home and End jump to the ends

- **WHEN** a tab in a strip has focus and the user presses End, then Home
- **THEN** the focus moves to the last tab, then to the first

#### Scenario: Enter chooses the focused tab

- **WHEN** the user has moved the focus to a tab that is not selected and presses Enter
- **THEN** that tab is chosen, as a click on it would choose it

#### Scenario: A container's inner strip behaves the same

- **WHEN** a container is open and a tab of its inner strip has focus
- **THEN** the arrow keys, Home and End move the focus within that strip only

### Requirement: Focus is visible, trapped where it must be, and given back

Focus SHALL be visibly indicated wherever it goes. A modal surface SHALL keep focus within itself
while it is open and SHALL return focus where it came from when it closes.

#### Scenario: A dialog does not leak focus

- **WHEN** a modal dialog is open and the user moves focus forward past its last control
- **THEN** focus stays within the dialog

#### Scenario: Closing a dialog restores focus

- **WHEN** a modal dialog closes
- **THEN** focus returns to what had it before

### Requirement: The first tab stop is a way past the chrome that stays on the page

Where the workbench draws a content area, the first stop in its focus order SHALL be a link that
moves the focus to the working area. Activating it SHALL NOT navigate: the application SHALL NOT
load again, and the address, the arrangement and any unsaved work SHALL stay as they were. This
SHALL hold at every address the application serves, not only at the root, and under any base the
distribution is served from.

The limit: a pop-out window draws no chrome to skip, so it carries no such link.

#### Scenario: The skip link at the root

- **WHEN** the person presses Tab once on a freshly loaded workbench at the root address and
  activates the focused link
- **THEN** the focus is in the working area

#### Scenario: The skip link below the root does not reload

- **WHEN** the workbench shows an address below the root and the person activates the skip link
- **THEN** the focus is in the working area
- **AND** no document is loaded and the address is unchanged

#### Scenario: Unsaved work survives the skip link

- **WHEN** a surface holds work that is not saved and the person activates the skip link
- **THEN** the work is still there, and the workbench asks no question about leaving

### Requirement: The user may enlarge text, and motion may be reduced

The workbench SHALL offer a text-size setting that scales the interface relative to the browser's
own base size rather than overriding it, and SHALL honour a system preference for reduced motion by
dropping non-essential animation.

#### Scenario: Enlarging text does not fight the browser's own setting

- **WHEN** the user enlarges text in the workbench
- **THEN** the interface scales relative to the browser's base size

#### Scenario: Reduced motion is respected

- **WHEN** the system asks for reduced motion
- **THEN** non-essential transitions and animations do not play

### Requirement: What a plugin inherits, and what it does not

A plugin that contributes declaratively or uses the workbench's own building blocks SHALL inherit
these guarantees. A plugin that draws its own interior SHALL be responsible for it, and the
workbench SHALL make the inherited path the easy one by offering named building blocks with the
guarantees already in them.

#### Scenario: A declarative contribution is accessible without effort

- **WHEN** a plugin contributes an item, a command or a settings row declaratively
- **THEN** the workbench draws it with the name, role and contrast the guarantee requires

#### Scenario: An isolated surface is on its own inside its frame

- **WHEN** a plugin draws its own interior
- **THEN** the workbench guarantees the chrome around it and not the content within it
