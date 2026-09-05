## MODIFIED Requirements

### Requirement: A consumer can have their own declarations checked

The platform SHALL offer checks for the declarations a consumer writes by hand: that a plugin
manifest is well formed, that a catalogue is usable, that translation bundles cover the same
keys, and that a command registration says what an agent needs to be offered it and to call it
well. A finding SHALL name the consequence rather than only the rule, because the workbench reads
these defensively and an unusable value disappears without a word.

A check SHALL be able to distinguish something it can judge from something it cannot, and say which.

For command registrations, the check SHALL report each command it finds with one of three outcomes:
offered to an agent; offered but described in a way that leaves the agent guessing, naming the
argument or the answer that lacks a description; or not offered, naming what closes it. Because a
command's reach is finally decided at runtime by grants and access, the check SHALL say that it
judged the registration alone. A strict mode SHALL fail on a command that is offered without a
description; it SHALL report an argument without a description and a returned value without a
declared answer without failing on them; and it SHALL NOT fail on a command that is simply not
offered, because closed is the default the platform intends.

#### Scenario: A finding says what it will cost

- **WHEN** a catalogue names a permission the platform does not define
- **THEN** the finding says that the workbench will drop it silently and what follows from that

#### Scenario: A missing translation key is found before a user meets it

- **WHEN** one language bundle lacks a key another has
- **THEN** the check reports it

#### Scenario: What cannot be judged is reported as such

- **WHEN** a value can only be judged in the browser
- **THEN** it is reported as a warning rather than passed or failed

#### Scenario: A command an agent is never offered is named

- **WHEN** a plugin's sources register a command that is not opened to callers other than its own
  plugin
- **THEN** the check lists it as not offered and says that an agent never sees it

#### Scenario: A command an agent would have to guess at is named

- **WHEN** a registered command is opened to other callers but lacks a description, or declares an
  argument without a description, or returns a value without declaring an answer
- **THEN** the check names the command and the missing piece and says what the agent sees instead

#### Scenario: Strict mode gates what closes a command, not what merely narrows it

- **WHEN** the check runs in strict mode over a plugin with one callable command without a
  description and one command that is not callable
- **THEN** it fails because of the first
- **AND** it does not fail because of the second

#### Scenario: The check names the limit of what it read

- **WHEN** the check reports on a directory
- **THEN** its report says that grants and access decide the rest at runtime and were not judged
