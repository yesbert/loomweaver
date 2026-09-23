## MODIFIED Requirements

### Requirement: A language change is applied everywhere at once

Choosing a language SHALL update what the user sees, what the document reports as its language, and
what is remembered for the next visit — as one act, with no partially switched state in between.
A language whose strings have not arrived yet SHALL be switched to once they have, so the interface
never shows keys in between. The choice SHALL be remembered, and sent to the application's other
windows, when the switch happens and not before, so neither runs ahead of what the user sees. The
limit: where the strings cannot be loaded, the switch SHALL happen anyway, however the load ends, so
a choice is never lost to a failed load.

#### Scenario: Switching the language updates the page and the record of it

- **WHEN** the user chooses a language
- **THEN** the workbench re-renders in that language
- **AND** the document's declared language matches it
- **AND** the choice is stored for the next visit

#### Scenario: A language not yet loaded is switched to once its strings are there

- **WHEN** the user chooses a language whose strings have not been loaded yet
- **THEN** the interface keeps the previous language until they have arrived
- **AND** then switches to the new one, showing words rather than keys

#### Scenario: A language whose strings cannot be loaded is still switched to

- **WHEN** the user chooses a language whose strings cannot be loaded, whether the load reports an
  error or ends without delivering anything
- **THEN** the workbench switches to it all the same, and the choice is stored
