## ADDED Requirements

### Requirement: The workbench draws a navigation tree from what a consumer declares

The workbench SHALL offer a navigation tree among its elements: a consumer declares destinations and
the workbench draws them, marks where the user is, and reports what the user chose.

The tree SHALL take its shape from the declaration rather than from a rule of thumb. A destination
MAY stand on its own, outside any group, and a group that is declared SHALL be drawn as a group even
where it holds a single destination. Nothing SHALL be promoted, merged or flattened on the
workbench's judgement, because a sidebar whose shape shifts with its contents is one the user cannot
learn.

Text SHALL arrive ready to display. The tree SHALL NOT translate what it is given, and a consumer
that changes language supplies the changed text.

The limit of that: the tree draws destinations and knows nothing of what they mean. It carries no
vocabulary of the products built on it, and choosing a destination is reported rather than acted on,
so nothing the tree does can move the user on its own.

#### Scenario: A group holding one destination is still a group

- **WHEN** a consumer declares a group with exactly one destination in it
- **THEN** the tree draws it as a group with one destination, not as a destination on its own

#### Scenario: A destination may stand outside every group

- **WHEN** a consumer declares a destination that belongs to no group
- **THEN** the tree draws it at the top level, beside the groups

#### Scenario: Choosing a destination is reported, not acted on

- **WHEN** the user chooses a destination
- **THEN** the tree reports which one, and nothing else happens until the consumer acts on it

#### Scenario: The declaration changing while the tree is on screen changes what is drawn

- **WHEN** a consumer adds, removes or renames a destination while the tree is on screen
- **THEN** the tree draws the new declaration

### Requirement: The navigation tree marks the destination the current address lies under

A consumer SHALL be able to tell the navigation tree which address is currently shown, and the tree
SHALL mark the destination that address lies at or under, applying the same segment rule the
workbench applies when a plugin asks the question directly. An address is under a destination only
where the destination's address is a whole prefix of it and not merely the start of its text.

The tree SHALL mark at most one destination, and SHALL mark none where the current address lies
under no destination it was given. The marking SHALL be announced to assistive technology as the
current item and not by appearance alone.

#### Scenario: A deeper address marks the destination it lies under

- **WHEN** the address shown lies below a destination the tree holds
- **THEN** that destination is marked

#### Scenario: A longer name is not a deeper address

- **WHEN** the address shown merely begins with a destination's address, without a segment boundary
  between them
- **THEN** that destination is not marked

#### Scenario: An address under nothing marks nothing

- **WHEN** the address shown lies under no destination the tree holds
- **THEN** no destination is marked

#### Scenario: Moving marks the destination moved to

- **WHEN** the address the consumer reports changes while the tree is on screen
- **THEN** the marking moves with it

### Requirement: A group folds, and stays as the user left it for the session

A group SHALL fold open and shut on the user's command, and the declaration SHALL be able to say
whether a group starts open or shut. Where the declaration says nothing, a group SHALL start open,
because a sidebar that hides everything until it is opened tells a first-time user nothing.

What the user folded SHALL survive for as long as the session lasts, including the tree being drawn
again after being taken off screen, so that following a link does not undo the shape the user made.

A group holding no destinations SHALL still be drawn, because the consumer declared it, and SHALL
offer no fold: a control that opens nothing is a promise the group cannot keep. Where destinations
arrive later, the fold SHALL be offered from then on.

The limit of that: nothing is kept beyond the session. The tree stores nothing of its own, so a
reload starts from what the declaration says.

#### Scenario: A group starts as the declaration says

- **WHEN** a consumer declares a group as starting shut
- **THEN** it is drawn shut, and its destinations are not on screen until the user opens it

#### Scenario: A group with nothing said about it starts open

- **WHEN** a consumer declares a group without saying whether it starts open
- **THEN** it is drawn open

#### Scenario: What the user folded outlives the tree leaving the screen

- **WHEN** the user shuts a group, the tree is taken off screen, and it is drawn again
- **THEN** the group is still shut

#### Scenario: A group with nothing in it offers no fold

- **WHEN** a consumer declares a group holding no destinations
- **THEN** the group is drawn and its heading offers nothing to fold

#### Scenario: A reload starts from the declaration again

- **WHEN** the session ends and the consumer draws the tree again
- **THEN** every group is as the declaration says, not as the user last left it
