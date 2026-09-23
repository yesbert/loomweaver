## MODIFIED Requirements

### Requirement: A language change is applied everywhere at once

Choosing a language SHALL update what the user sees, what the document reports as its language, and
what is remembered for the next visit — as one act, with no partially switched state in between.
A language whose strings have not arrived yet SHALL be switched to once they have, so the interface
never shows keys in between, and the choice SHALL be remembered, and sent to the application's other
windows, in that same step and not before.

A language whose strings cannot be loaded SHALL NOT be switched to, whether the load reports an
error, ends without delivering anything, or has delivered nothing after ten seconds: what the user
sees, the document's language and what is remembered stay as they were, and a language control shows
the language still in effect, so the same choice can simply be made again. A language that arrives
from storage or from another window and is already the one in effect SHALL NOT cancel a choice that
is still loading.

#### Scenario: Switching the language updates the page and the record of it

- **WHEN** the user chooses a language
- **THEN** the workbench re-renders in that language
- **AND** the document's declared language matches it
- **AND** the choice is stored for the next visit

#### Scenario: A language not yet loaded is switched to once its strings are there

- **WHEN** the user chooses a language whose strings have not been loaded yet
- **THEN** the interface keeps the previous language until they have arrived
- **AND** then switches to the new one, showing words rather than keys

#### Scenario: A language whose strings cannot be loaded is not switched to

- **WHEN** the user chooses a language whose strings cannot be loaded, whether the load reports an
  error, ends without delivering anything, or delivers nothing within ten seconds
- **THEN** the interface, the document's language and the stored choice stay as they were
- **AND** the language control shows the language still in effect
