## ADDED Requirements

### Requirement: The search over open work is reachable without knowing its shortcut

A distribution SHALL be able to place a visible entry point to the search over open work in its
chrome, showing the shortcut that also opens it, and sized to match its neighbours in the bar it
sits in. It SHALL be placeable independently of the entry point to the command search, so that a
product may offer either, both, or neither, and may put each in a different bar.

#### Scenario: The visible entry point opens the search over open work

- **WHEN** the user activates the entry point
- **THEN** the search over open work opens, in that mode and not as the command search

#### Scenario: The entry point fits its bar

- **WHEN** the entry point is placed in a bar
- **THEN** its height matches the other controls of that bar

#### Scenario: Either search may be offered without the other

- **WHEN** a distribution places the entry point to one search and not the other
- **THEN** only the placed one appears

### Requirement: A visible entry point does not outlive the search it opens

A visible entry point to a search SHALL be shown only while that search is reachable for the current
user. Where the distribution has removed the search, or the session may not run it, the entry point
SHALL be absent rather than present and inert, so that no control offers a route the workbench has
already closed.

The limit of this guarantee: switching off the shortcut layer does not close the route. The entry
point SHALL remain, because activating it still opens the search; it SHALL simply advertise no
chord, in keeping with nothing advertising a key that does nothing.

#### Scenario: Removing the search removes its entry point

- **WHEN** a distribution removes a search from its chrome
- **THEN** the visible entry point to that search is gone as well, and no control remains that does
  nothing when activated

#### Scenario: A session that may not search sees no entry point

- **WHEN** the session does not meet what the search requires of it
- **THEN** the entry point to that search is not shown

#### Scenario: Without shortcuts the entry point stays and promises nothing

- **WHEN** a distribution switches the shortcut layer off
- **THEN** the entry point is still shown and still opens the search
- **AND** it names no chord
