## MODIFIED Requirements

### Requirement: Exactly one workspace is active, and it remembers itself

There SHALL always be exactly one active workspace, and the arrangement the user works in SHALL
belong to it. Switching SHALL store what the user had and restore what the target had, so that
returning finds it as it was left. Neither a switch nor a reset SHALL carry the content the user
was looking at into the arrangement it restores: that arrangement holds what the workspace held, and
the content it then shows is the one it names.

The choice of workspace SHALL survive a restart.

#### Scenario: Switching and returning finds the arrangement unchanged

- **WHEN** the user rearranges one workspace, switches to another and comes back
- **THEN** the first is as they left it

#### Scenario: A workspace never used yet starts from its own baseline

- **WHEN** the user switches to a workspace they have not changed
- **THEN** it opens in the state it was defined with

#### Scenario: The active workspace survives a restart

- **WHEN** the application restarts
- **THEN** the workspace the user was in is active

#### Scenario: A switch does not bring the content the user left

- **WHEN** the user is on content in one workspace and switches to another that does not hold it
- **THEN** the workspace switched to does not gain a tab for that content, however long its own
  content takes to appear

#### Scenario: A reset does not keep the content the user left

- **WHEN** the user is on content their workspace's baseline does not hold and resets the workspace
- **THEN** the reset arrangement does not hold a tab for that content
