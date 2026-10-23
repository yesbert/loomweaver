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
argument or the answer that lacks a description; or not offered, naming what closes it. Where a
command is offered, the report SHALL also say what the command states about an agent's word being
enough to run it, and say that it states nothing where it states nothing. Because a command's reach
is finally decided at runtime by grants and access, the check SHALL say that it judged the
registration alone. A strict mode SHALL fail on a command that is offered without a
description; it SHALL report an argument without a description and a returned value without a
declared answer without failing on them; and it SHALL NOT fail on a command that is simply not
offered, because closed is the default the platform intends. It SHALL NOT fail on, nor warn about, a
command that states nothing about an agent's word, and SHALL NOT guess from a command's identity or
its label what running it would cost: saying nothing is a declaration the platform accepts, and a
guess a consumer cannot act on teaches them to overlook the report.

The command check reads a consumer's sources with the TypeScript compiler of the consumer's own
project. Where that project's TypeScript offers no programming interface to read sources with, as
the native rewrite does not, the check SHALL read them through the compatibility release of the
previous interface when the project has it installed. Where it has neither, the check SHALL say
which of the two it found, and for a TypeScript without the interface name what to install, rather
than failing inside the compiler. The limit: the check never brings a compiler of its own.

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

#### Scenario: What a command says about an agent's word is reported

- **WHEN** a registered command is opened to other callers and states that the person is asked every
  time
- **THEN** the report says so for that command

#### Scenario: Saying nothing is reported as saying nothing, and fails nothing

- **WHEN** the check runs in strict mode over a plugin with one described callable command that
  states nothing about an agent's word
- **THEN** the report says that the command states nothing
- **AND** the check does not fail and does not warn on that account

#### Scenario: Strict mode gates what closes a command, not what merely narrows it

- **WHEN** the check runs in strict mode over a plugin with one callable command without a
  description and one command that is not callable
- **THEN** it fails because of the first
- **AND** it does not fail because of the second

#### Scenario: The check names the limit of what it read

- **WHEN** the check reports on a directory
- **THEN** its report says that grants and access decide the rest at runtime and were not judged

#### Scenario: A project on the native TypeScript is checked through the compatibility release

- **WHEN** the command check runs in a project whose TypeScript offers no programming interface, and
  the compatibility release of the previous interface is installed beside it
- **THEN** the check reads the sources and reports as it does on a TypeScript that has the interface

#### Scenario: A project on the native TypeScript alone is told what to install

- **WHEN** the command check runs in a project whose TypeScript offers no programming interface, and
  the compatibility release is not installed
- **THEN** the check reports that the installed TypeScript offers no interface to read sources with
  and names the release to install
- **AND** it does not fail inside the compiler
