## ADDED Requirements

### Requirement: Completing the opening address never overrules the user

The workbench MAY complete the opening of the application at the address it was opened with once the
content that address names becomes reachable, so that content belonging to a plugin that arrives late
is still reached.

It SHALL NOT do so once the user has navigated somewhere else. An opening that is finished after the
user has moved SHALL be abandoned rather than taken up, however it was started, because a person who
has gone somewhere is not waiting to be sent back.

This holds for the whole life of the application, not only for its first moments: the address the
application was opened with SHALL stop being a destination as soon as the user has chosen one.

#### Scenario: A late arrival does not pull the user back

- **WHEN** the application is opened at an address whose content is not reachable yet, the user
  navigates elsewhere, and that content becomes reachable afterwards
- **THEN** the user stays where they navigated to

#### Scenario: A late arrival is still reached where the user has not moved

- **WHEN** the application is opened at an address whose content is not reachable yet, the user does
  not navigate, and that content becomes reachable afterwards
- **THEN** the content the address names is shown
