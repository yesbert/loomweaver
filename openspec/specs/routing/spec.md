# routing Specification

## Purpose
Content in the main area has an address, so a link can be shared, the browser's back and forward
buttons work, and reloading returns the user where they were. The platform owns the mechanics of
that; what an address *means* below its first segments belongs to the plugin that claimed it.

## Requirements

### Requirement: Content has a shareable address; arrangement does not

The address SHALL identify the content shown and its parameters, and SHALL NOT carry the user's
arrangement — which panels are open, how wide they are, which pane is where. Sharing an address
SHALL therefore share the content and not the sender's layout.

#### Scenario: A link opens the content, not a layout

- **WHEN** an address is opened in a fresh session
- **THEN** the content it names is shown, and the arrangement is the recipient's own

#### Scenario: Rearranging does not change the address

- **WHEN** the user collapses a panel or splits a pane
- **THEN** the address is unchanged

### Requirement: Navigating reaches the content where it already is

Where the user has content open somewhere in the workbench, navigating to that content SHALL reach
the copy that is already open rather than opening a second one beside whatever they were looking at.
This SHALL hold however the navigation was started — by the application's own chrome, by a link or a
programmatic navigation inside content, or by browser history — because a user cannot tell those
apart and would meet two different behaviours for one gesture.

Reaching an existing copy SHALL move only which part of the arrangement carries the address; it SHALL
NOT move, rebuild or reorder anything the user arranged.

The guarantee is about the content, not its parameters: content open at a different parameter value
is different content, and navigating to it opens it rather than reusing what is there.

#### Scenario: An ordinary link reaches the copy in another pane

- **WHEN** content is open in one pane and a link inside another navigates to it
- **THEN** the pane already holding it takes the address, and no second copy is opened

#### Scenario: The chrome and a link behave alike

- **WHEN** the same address is reached once from the workbench's own chrome and once from a link
  inside content
- **THEN** the outcome is the same in both cases

#### Scenario: Reaching an open copy leaves the arrangement alone

- **WHEN** navigation reaches content another part of the arrangement already holds
- **THEN** nothing is moved, rebuilt or reordered, and the panes keep what they were showing

#### Scenario: Nothing open yet means an ordinary open

- **WHEN** navigation names content that is open nowhere
- **THEN** it opens where the address is currently carried

#### Scenario: A different parameter value is not an existing copy

- **WHEN** content is open at one parameter value and navigation names another
- **THEN** the second is opened rather than the first being reused

### Requirement: A deep link survives arriving before the plugin that answers it

Content is contributed by plugins that may register after the first navigation. An address opened
directly SHALL therefore be remembered and resolved once the content that answers it exists — but
SHALL NOT be chased once the user has navigated somewhere else themselves.

Waiting SHALL be quiet: while the address is remembered the workbench SHALL NOT report the address
as unreachable, because a plugin that has not registered yet is the expected case rather than a
fault.

Where such an address is never answered, whatever the workbench shows instead SHALL be shown only.
It SHALL NOT become part of a workspace's remembered arrangement, because an arrangement is what the
product declared and what the user chose, and a navigation that did not succeed is neither. The
limit of this guarantee is what is remembered, not what is displayed: the workbench MAY show
fallback content, and MAY leave the address in the address bar.

#### Scenario: An address opened directly waits for its content

- **WHEN** the application is opened at an address whose content registers later
- **THEN** the content is shown once it registers

#### Scenario: Waiting is not reported as a failure

- **WHEN** the application is opened at an address whose content has not registered yet
- **THEN** the address is remembered and nothing is reported as unreachable

#### Scenario: The pending address is abandoned when the user moves on

- **WHEN** the user navigates away before the pending content registers
- **THEN** the workbench does not pull them back

#### Scenario: The starting screen is not treated as a pending address

- **WHEN** the application is opened at its starting address
- **THEN** nothing is remembered as pending

#### Scenario: An address that is never answered leaves the workspace as it was

- **WHEN** an address opened directly is claimed by a workspace and is never answered
- **THEN** that workspace's remembered content is unchanged
- **AND** switching into it later shows the content the workspace declares, not what was shown
  instead

#### Scenario: Nothing unclosable is left behind

- **WHEN** the workbench shows fallback content because an address could not be answered
- **THEN** the user is never left with content in a workspace that they cannot close or leave

### Requirement: A plugin may own everything below the address it claims

A plugin MAY declare that it owns the whole address space below the one it claims. The workbench
SHALL then hand it everything below that point verbatim, including any query string and fragment,
and the plugin SHALL be able to change it without the content being rebuilt.

The claimed address SHALL remain the identity of the tab, so movement within the owned space is
movement inside one tab.

#### Scenario: Everything below the claimed address is handed over

- **WHEN** an address below a claimed one is opened
- **THEN** the remainder is handed to the content unchanged, including a query string and fragment

#### Scenario: Moving within the owned space does not rebuild the content

- **WHEN** the content changes its own remainder
- **THEN** it is not rebuilt, and the tab is unchanged

#### Scenario: A neighbouring address is not mistaken for a deeper one

- **WHEN** an address is opened that merely begins with the same characters as a claimed one
- **THEN** it is not treated as belonging to it

### Requirement: Claiming a very broad address requires the right to navigate

Owning everything below an address is safe only where the claim is narrow enough to be a boundary.
A claim shorter than two segments SHALL therefore additionally require the capability to drive
navigation, because a plugin owning nearly the whole address space is no longer constrained by
owning its own.

#### Scenario: A narrow claim needs no extra right

- **WHEN** a plugin claims an address of two or more segments and owns what is below it
- **THEN** it needs no navigation capability for that

#### Scenario: A very broad claim is refused without the right

- **WHEN** a plugin claims a one-segment address and owns everything below it, without the
  navigation capability
- **THEN** the claim is refused

### Requirement: Named sub-addresses may carry values, and the root is reachable

Content MAY declare named sub-addresses, which MAY carry values. The bare claimed address SHALL
remain valid and SHALL NOT redirect to the first sub-address; the content decides what to show
there.

#### Scenario: A sub-address carrying a value is a shareable link

- **WHEN** an address containing a sub-address with a value is opened directly
- **THEN** the content is restored at that sub-address

#### Scenario: The bare address stays put

- **WHEN** the claimed address is opened without a sub-address
- **THEN** it stays there rather than redirecting

#### Scenario: A declared sub-address wins over the owned remainder

- **WHEN** an address matches both a declared sub-address and the owned remainder
- **THEN** the declared sub-address is used

### Requirement: A tab may follow the current selection

Content MAY declare that its address is a facet of whatever is currently selected rather than an
independent destination. The workbench SHALL then compute its address by substituting the values it
knows, by name, truncating before the first value it does not know.

Where the computed address leads nowhere, the tab SHALL NOT be drawn at all, rather than being drawn
as a control that fails when used. A distribution MAY override the computation per tab.

#### Scenario: A following tab points at the current selection

- **WHEN** content declares that it follows and the current selection supplies the values it needs
- **THEN** its address names that selection

#### Scenario: A following tab with nowhere to go is not drawn

- **WHEN** the values a following tab needs are unknown
- **THEN** the tab is not drawn

#### Scenario: Content that did not opt in keeps its own address

- **WHEN** the selection changes and content did not declare that it follows
- **THEN** its address is unchanged

#### Scenario: A product may compute the address itself

- **WHEN** a distribution supplies its own computation for a tab
- **THEN** it is used as given

#### Scenario: Following stops where the address does not reach

- **WHEN** a following tab is held by a pane that does not carry the address
- **THEN** that copy keeps the address it had

### Requirement: A parameter name means one thing under one prefix

Two contents that follow the selection SHALL NOT claim the same parameter name under different
prefixes, because the workbench would have no way to know which value is meant. A conflicting
declaration SHALL be refused, and only that declaration, so the application keeps running.

This SHALL apply only to content that opts into following; ordinary content may reuse a name freely.

#### Scenario: A conflicting following declaration is refused alone

- **WHEN** a following declaration reuses a parameter name that means something else elsewhere
- **THEN** that declaration is refused and reported
- **AND** the rest of the application is unaffected

#### Scenario: The same name under the same prefix is fine

- **WHEN** two following declarations use the same parameter name under an identical prefix
- **THEN** both are accepted

#### Scenario: Ordinary content may reuse a name

- **WHEN** two contents that do not follow use the same parameter name under different prefixes
- **THEN** neither is refused

### Requirement: Content a distribution removed leaves an explanation, not a redirect

Where a distribution removes content, its address SHALL stop resolving to it and SHALL instead show
an explanation while keeping the address, rather than falling back to the starting screen. Removal
SHALL be lasting, so content registering later under that address stays removed.

#### Scenario: A removed address explains itself

- **WHEN** an address whose content the distribution removed is opened
- **THEN** the address stays and an explanation is shown

#### Scenario: Removal outlasts a later registration

- **WHEN** content registers under a removed address after the fact
- **THEN** it stays removed

### Requirement: An address with different values is different content

Where the same content is opened with different parameter values, the workbench SHALL treat those as
different content: each has its own address, its own tab and its own state, and navigating between
them SHALL NOT reuse one for the other.

Whether the instance behind an address survives being navigated away from is not decided here; by
default a clean one does not.

#### Scenario: Two values of one address do not share state

- **WHEN** the same content is opened at two different parameter values
- **THEN** each keeps its own state

#### Scenario: Navigating between them is a real change

- **WHEN** the user navigates from one value to another of the same content
- **THEN** the content is shown for the new value rather than the previous one being reused

### Requirement: A plugin may read what is currently shown

A plugin SHALL be able to read what the workbench is currently showing: which surface it is, the
address it is at, and the values that address carries. The read SHALL be live, so that a plugin can
react to the user moving around rather than polling.

This SHALL require the same permission as driving the content area, because knowing what a user is
looking at is not something an ungranted plugin should have.

#### Scenario: A plugin follows what the user is looking at

- **WHEN** the user moves to different content
- **THEN** a plugin reading the active content sees the new surface, address and values

#### Scenario: Nothing is shown, and the read says so

- **WHEN** the workbench is showing nothing addressable
- **THEN** the read reports that rather than reporting a stale value

#### Scenario: Reading it without the permission is refused

- **WHEN** a plugin without permission for the content area reads the active content
- **THEN** it is refused
