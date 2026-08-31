## ADDED Requirements

### Requirement: Stored content a workspace may no longer hold is dropped and named

A workspace's arrangement outlives the declarations it was built against. What a product declares
can change between one release and the next, and content stored under a workspace SHALL therefore be
read against the declarations in force now, not against the ones in force when it was written.

Where a workspace holds stored content at an address another declared workspace claims, that content
SHALL be dropped as the arrangement is restored, and the developer SHALL be told which workspace held
it and which address was dropped. It SHALL NOT be moved to the claiming workspace: the user never
chose to have it there, and an arrangement that grows a pane nobody opened is worse than one that
loses a pane nobody sees.

Dropping SHALL be silent for stored content that is merely malformed, and SHALL be announced only
where the stored state contradicts a current declaration. The distinction is who can act on it: a
malformed record tells a developer nothing they can fix, whereas a contradiction is usually the
product's own declaration having moved, which is theirs to know about.

An address no declared workspace claims SHALL NOT be dropped, wherever it is stored. Content that
belongs nowhere in particular belongs where the user left it.

The announcement SHALL be a development-time message and SHALL NOT reach the user, who did nothing
and can do nothing about it.

Where a product's working state can only be read back asynchronously, the repair SHALL NOT apply and
the stored arrangement SHALL be restored unchanged. Emptying part of an arrangement on a guess is
worse than leaving one stale tab in it.

#### Scenario: A tab another workspace now claims does not come back

- **WHEN** a workspace's stored arrangement holds content at an address a declared workspace claims,
  and that arrangement is restored
- **THEN** the workspace comes up without that content
- **AND** the claiming workspace has not gained it

#### Scenario: The developer is told what was dropped

- **WHEN** stored content is dropped because a declaration now places it elsewhere
- **THEN** the developer is told, in development, which workspace held it and which address went
- **AND** nothing is shown to the user

#### Scenario: Unclaimed content is left where it was

- **WHEN** a workspace's stored arrangement holds content at an address no declared workspace claims
- **THEN** it is restored unchanged

#### Scenario: A malformed record goes quietly

- **WHEN** stored content cannot be read as an arrangement at all
- **THEN** it is dropped without a message, because it names nothing anyone could act on

#### Scenario: A product whose working state reads back asynchronously is left alone

- **WHEN** a workspace's arrangement is restored from working state that cannot be read back at once
- **THEN** it is restored as it was stored, with nothing dropped
