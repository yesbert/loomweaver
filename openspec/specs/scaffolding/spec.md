# scaffolding Specification

## Purpose
Getting started on a plugin platform is mostly ceremony: a project, a manifest, a registration, a
translation file, the wiring that connects them. Generating that removes the part where a newcomer
gets it subtly wrong, and it is also how the platform stays honest — generated output that does not
build is a documentation error that cannot hide.

## Requirements

### Requirement: One description of a generator serves every way of invoking it

Each generator SHALL be described once — its options, their types, their defaults, what is required —
and every route a consumer uses SHALL derive its surface from that description. An option SHALL NOT
exist on one route and be missing or ignored on another.

#### Scenario: An option behaves the same however it is invoked

- **WHEN** a generator's option is supplied through any of the supported routes
- **THEN** it takes effect identically

#### Scenario: The published description matches what is offered

- **WHEN** a generator's options change
- **THEN** every route's published description changes with them

### Requirement: Generated output builds, passes its own checks, and needs no repair

What a generator produces SHALL compile against the published contract and SHALL pass the checks the
platform's own conventions impose, including its own naming and its own style rules. It SHALL NOT
require a consumer to fix it before it works.

#### Scenario: A generated project passes its own lint

- **WHEN** a project is generated with a non-default naming prefix
- **THEN** it passes the very lint rules the generator itself emitted

#### Scenario: A generated project has something to test

- **WHEN** a project is generated in a workspace that runs unit tests
- **THEN** it is wired for tests and has a starter test to run

#### Scenario: A workspace that tests differently gets no test wiring

- **WHEN** a project is generated in a workspace that runs no unit tests
- **THEN** no test wiring and no starter test are emitted

### Requirement: Generated output is for the consumer's project, not the platform's

Generated code SHALL reference the published packages rather than any location inside the platform's
own repository, and SHALL take its naming, its placement and its import path from the workspace it is
generated into.

#### Scenario: Imports name the published packages

- **WHEN** any output is generated
- **THEN** it imports from the published packages

#### Scenario: The consumer's own conventions are followed

- **WHEN** output is generated into a workspace with its own naming scope
- **THEN** the generated import path uses that scope

#### Scenario: Placement is the consumer's decision

- **WHEN** a target directory, project name or naming prefix is supplied
- **THEN** the output is placed and named accordingly, at any depth

### Requirement: Nothing is overwritten without being asked

A generator SHALL refuse rather than overwrite, naming what is in the way and how to proceed. A
consumer SHALL be able to see what would be written without anything being written, including which
files a real run would refuse.

Where overwriting is permitted, it SHALL replace the entry in the target rather than following it
somewhere else, and SHALL refuse a target that would lead outside the directory it was given.

#### Scenario: An existing file stops the run and is named

- **WHEN** something the generator would write already exists
- **THEN** the run stops, names it, and says how to proceed

#### Scenario: A trial run writes nothing and reports the refusals

- **WHEN** a trial run is requested
- **THEN** nothing is written
- **AND** the files a real run would refuse are named

#### Scenario: Overwriting does not write through a link

- **WHEN** overwriting is permitted and the target is a link
- **THEN** the entry in the target directory is replaced rather than what it points at

#### Scenario: A target leading outside the directory is refused

- **WHEN** a target would resolve outside the directory the generator was given
- **THEN** it is refused

### Requirement: A mistyped option fails rather than being ignored

An option a generator does not know SHALL stop the run and be named. A required option that is
missing SHALL be reported rather than producing a partial result, and a value given to something that
takes none SHALL be refused.

#### Scenario: A mistyped option is caught

- **WHEN** an option is misspelled
- **THEN** the run stops and names it, rather than generating output without it

#### Scenario: A missing required option is reported

- **WHEN** a required option is absent
- **THEN** the run reports it rather than failing part-way through

### Requirement: A generator composes into what is already there

Where a generator adds to an existing project, it SHALL keep what that project declared for itself
and SHALL NOT rename it. Where it needs to know which project to add to, it SHALL determine that from
the workspace, and where the answer is ambiguous it SHALL name the candidates rather than guessing.

#### Scenario: Adding to an existing project keeps its own declarations

- **WHEN** a generator composes into a project that already exists
- **THEN** what that project declared for itself is preserved

#### Scenario: An ambiguous target names the candidates

- **WHEN** more than one project could be the target
- **THEN** the generator names them rather than choosing

#### Scenario: Renaming an existing project is refused

- **WHEN** composing would rename the project already there
- **THEN** it is refused

### Requirement: A consumer can have their own declarations checked

The platform SHALL offer checks for the declarations a consumer writes by hand: that a plugin
manifest is well formed, that a catalogue is usable, and that translation bundles cover the same
keys. A finding SHALL name the consequence rather than only the rule, because the workbench reads
these defensively and an unusable value disappears without a word.

A check SHALL be able to distinguish something it can judge from something it cannot, and say which.

#### Scenario: A finding says what it will cost

- **WHEN** a catalogue names a permission the platform does not define
- **THEN** the finding says that the workbench will drop it silently and what follows from that

#### Scenario: A missing translation key is found before a user meets it

- **WHEN** one language bundle lacks a key another has
- **THEN** the check reports it

#### Scenario: What cannot be judged is reported as such

- **WHEN** a value can only be judged in the browser
- **THEN** it is reported as a warning rather than passed or failed
