## REMOVED Requirements

### Requirement: A language change is applied everywhere at once

**Reason**: It promised a switch with no partially switched state, which no released version kept,
and the unreleased attempt to keep it by loading before switching fought the translation library's
own fallback in every failure path. It is replaced by a requirement that states what the workbench
guarantees: one step, and words wherever keys stood as soon as the strings arrive.

**Migration**: Nothing to migrate. The behaviour is the one released in 0.13.0, now with open menus
re-worded as well; see *A language change reaches everything the workbench draws*.

## ADDED Requirements

### Requirement: A language change reaches everything the workbench draws

Choosing a language SHALL update what the user sees, what the document reports as its language, and
what is remembered for the next visit, in one step. Text whose strings in the new language have not
arrived yet MAY show its keys for that moment, because the workbench does not hold the interface
back while they load. Everything the workbench draws, open menus included, SHALL show the words as
soon as the strings arrive, without a reload and without the user doing anything.

The limit: where the strings of the chosen language cannot be loaded, the interface shows what the
translation library falls back to, and the choice is still remembered, so the next visit tries it
again.

#### Scenario: Switching the language updates the page and the record of it

- **WHEN** the user chooses a language
- **THEN** the workbench re-renders in that language
- **AND** the document's declared language matches it
- **AND** the choice is stored for the next visit

#### Scenario: Words replace keys as soon as the strings arrive

- **WHEN** the user chooses a language whose strings have not been loaded yet, while a menu is open
- **THEN** keys may show until the strings arrive
- **AND** once they have arrived, the page and the open menu show the words in that language
