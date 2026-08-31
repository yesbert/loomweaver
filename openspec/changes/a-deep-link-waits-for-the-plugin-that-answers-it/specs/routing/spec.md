## MODIFIED Requirements

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
