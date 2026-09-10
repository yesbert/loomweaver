## REMOVED Requirements

### Requirement: A distribution may say where a first visit starts

**Reason**: The declaration now governs every opening of the application, not the first one alone,
and the statement that a returning user is left where they were no longer holds at an address that
names no content. The requirement below replaces it in full.

**Migration**: A distribution that declares a starting workspace needs no change: what held for the
first visit now holds for every opening. A distribution that relied on a return leaving the user in
the workspace they last used, at an address naming no content, either declares no starting workspace
or declares one that holds no content of its own; both leave the address alone.

## ADDED Requirements

### Requirement: A distribution may say where an opening starts

A distribution SHALL be able to name the workspace the application opens in, and every opening at an
address that names no content SHALL land there — the first one and every one after it. Landing there
SHALL show what the workspace holds, not merely make it the active one.

What the workspace holds SHALL be what the user left in it, and its declaration only where they left
nothing: an opening restores a workspace, it does not reset one.

Taking the declared start SHALL NOT leave a step behind in the user's history, so that going back
does not return to the address that named no content.

Where the declaration names no content of its own, there is nothing to land on, and the opening
SHALL do nothing at all: the address is left as it is, so is the workspace the visitor would
otherwise have been left in, and what a distribution serves at the address that names no content is
what the visitor sees.

Where the distribution itself declares what the address naming no content leads to, that declaration
SHALL answer and the opening SHALL stand down: a product that says where its bare address goes is not
overruled by the workbench.

An address that names content SHALL win over the declaration. Where that address is claimed by a
workspace, winning SHALL extend to the active workspace and not only to what is shown: the visitor
starts in the claiming workspace rather than in the declared one.

The address the application is opened at without a path SHALL NOT count as naming content, whatever
a product serves there: opening the application is not the same as following a link into it.

#### Scenario: A first visit lands in the declared workspace

- **WHEN** a user opens the application for the first time and a workspace is declared as the start
- **THEN** that workspace is active

#### Scenario: A first visit shows the content the workspace declares

- **WHEN** a first visit opens the application without naming content
- **THEN** the content area shows the workspace's own active tab, not what the bare address would
  otherwise resolve to

#### Scenario: A later opening lands there too

- **WHEN** a user who has used the application before opens it again without naming content
- **THEN** the declared workspace is active and its content is shown

#### Scenario: A later opening shows the workspace as it was left

- **WHEN** a user rearranges the declared workspace, opens something else in it, and later opens the
  application again without naming content
- **THEN** the declared workspace is shown as they left it, not as its declaration describes

#### Scenario: The workspace the user left keeps what they left in it

- **WHEN** a user who was last in another workspace opens the application without naming content
- **THEN** they start in the declared workspace
- **AND** switching back to the one they left shows it as they left it

#### Scenario: Going back does not return to the address that named nothing

- **WHEN** the application is opened without naming content and lands in the declared workspace
- **THEN** the address that named no content is not a step the user can go back to

#### Scenario: A route the distribution owns for the bare address answers

- **WHEN** a distribution declares both a starting workspace holding content and its own answer for
  the address that names no content, and the application is opened there
- **THEN** the distribution's own answer is what happens
- **AND** the workspace the visitor was last in stays active

#### Scenario: A declaration with no content of its own leaves the address alone

- **WHEN** a distribution declares a starting workspace that names no content of its own, and the
  application is opened without naming content
- **THEN** the address is unchanged and what the distribution serves there is shown
- **AND** the workspace that was active stays active

#### Scenario: A surface served at the bare address does not displace the declaration

- **WHEN** a product serves a surface at the address that names no content, and declares a starting
  workspace that holds content of its own
- **THEN** the opening shows the workspace's content
- **AND** that surface is still reachable at its address

#### Scenario: A shared address wins

- **WHEN** the application is opened at an address naming content
- **THEN** that content is shown regardless of the declared starting workspace

#### Scenario: A shared address that is claimed also decides the workspace

- **WHEN** a first visit opens the application at an address a workspace claims, and a different
  workspace is declared as the start
- **THEN** the claiming workspace is active
