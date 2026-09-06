## ADDED Requirements

### Requirement: An unanswered address a workspace claims is shown where it belongs

Where an address nothing answers lies under one a workspace claims, the workbench SHALL make that
workspace the active one while it shows, at that address, the explanation that the content is not
available. It SHALL NOT leave the user in the workspace that claims the starting address, because an
explanation read under a foreign sidebar makes the module the user asked for look empty rather than
incomplete.

What is shown at the address is unchanged by this: the workbench keeps the address and shows the
explanation exactly as it did.

This SHALL hold however the address came to be unanswered: never registered, registered by a plugin
that has since been removed, or carried by an arrangement stored before the content went away.

The limit of this guarantee is the claim. An address **no** workspace claims SHALL keep the outcome
it has today, since nothing better can be said about a mistyped address than to show the starting
screen. The guarantee is also about where the user lands, not about what is remembered: what is
shown instead SHALL still not become part of a workspace's remembered arrangement.

Waiting SHALL be unaffected. While an address is still being waited for, nothing SHALL be explained
or reported, because a plugin that has not registered yet is the expected case rather than a fault.

#### Scenario: An address a workspace claims lands in that workspace

- **WHEN** the workbench opens at an address a workspace claims and nothing answers it
- **THEN** that workspace is the active one
- **AND** the address stays, with the explanation shown at it

#### Scenario: The plugin that answered it was removed

- **WHEN** a plugin that answered an address a workspace claims is removed, and that address is
  opened afterwards
- **THEN** the workspace that claims it is the active one, with the explanation shown at that address

#### Scenario: An address nobody claims is unchanged

- **WHEN** the workbench opens at an address no workspace claims and nothing answers it
- **THEN** the outcome is the one it has today, and no workspace is entered on account of the claim

#### Scenario: Waiting is still quiet

- **WHEN** the workbench opens at an address whose content has not registered yet
- **THEN** the address is waited for, and no explanation is shown while it is

#### Scenario: What is shown instead is still not remembered

- **WHEN** the workbench shows the explanation at a claimed address that nothing answers
- **THEN** that workspace's remembered arrangement is unchanged
- **AND** switching into it later shows the content the workspace declares
