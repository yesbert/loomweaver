## MODIFIED Requirements

### Requirement: A language change is applied everywhere at once

Choosing a language SHALL update what the user sees, what the document reports as its language, and
what is remembered for the next visit — as one act, with no partially switched state in between.
A language whose strings have not arrived yet SHALL be switched to once they have, so the interface
never shows keys in between, and the choice SHALL be remembered, and sent to the application's other
windows, in that same step and not before.

A language whose strings cannot be loaded SHALL NOT be switched to and SHALL NOT be remembered,
whether the load reports an error, ends without delivering that language's strings, or has delivered
nothing after ten seconds, so the same choice can simply be made again. What the workbench reports as
its language, the document's language and the shipped language control SHALL always name the
language the interface is shown in, including one the translation library falls back to on its own
and one a product activates through that library directly, so they never disagree with the page.

A language that arrives from storage after the user has chosen one SHALL NOT override a choice that
loaded; it applies only if no choice has loaded. A language chosen in another window SHALL replace a
choice here that is still loading, so the windows end in the same language.

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
- **THEN** the interface stays in a language whose strings it has, and the stored choice is unchanged
- **AND** the document's language and the language control name the language the interface is shown
  in

#### Scenario: A stored language arriving late does not undo a choice

- **WHEN** the user chooses a language before the stored one has been read, and the stored one
  arrives afterwards naming another
- **THEN** the language the user chose is the one switched to and remembered

#### Scenario: The windows end in the same language

- **WHEN** a language chosen in one window reaches another while a choice made there is still loading
- **THEN** both windows end in the language chosen last
