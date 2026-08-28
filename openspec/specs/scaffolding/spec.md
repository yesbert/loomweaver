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

Producing sources alone does not satisfy this. Where generated output needs configuration elsewhere in
the workspace before it runs, a generator with access to that workspace SHALL produce that
configuration too. A build that reports success while the generated product does not work SHALL be
treated as the same defect as a build that fails, because it hides rather than reports.

This holds for the generated product as it is served, not only as it is compiled: the workbench's
chrome SHALL render with its own styles applied and its own strings resolved, and nothing the
generator itself put in place SHALL contradict anything else it put in place.

#### Scenario: A generated project passes its own lint

- **WHEN** a project is generated with a non-default naming prefix
- **THEN** it passes the very lint rules the generator itself emitted

#### Scenario: A generated project has something to test

- **WHEN** a project is generated in a workspace that runs unit tests
- **THEN** it is wired for tests and has a starter test to run

#### Scenario: A workspace that tests differently gets no test wiring

- **WHEN** a project is generated in a workspace that runs no unit tests
- **THEN** no test wiring and no starter test are emitted

#### Scenario: A generated distribution runs without further wiring

- **WHEN** a distribution is generated into an application workspace and served without further edits
- **THEN** the workbench chrome renders laid out and styled
- **AND** its own strings resolve rather than showing their keys
- **AND** nothing it registers for itself fails to load

#### Scenario: The styles the chrome relies on are actually produced

- **WHEN** generated output relies on a style pipeline to produce the classes the workbench's
  templates use
- **THEN** the generator produces that pipeline's configuration as well as the stylesheet that needs
  it
- **AND** the served styles contain those classes

#### Scenario: What the generator emits does not contradict itself

- **WHEN** generated output is built for release
- **THEN** the restrictions the generator placed on the generated document permit everything the
  build settings it generated will do
- **AND** the result is styled, as the development build is

#### Scenario: A generated stylesheet carries no directive its build will not consume

- **WHEN** a generated stylesheet is served
- **THEN** it contains no build-time directive left unprocessed

### Requirement: A generated distribution shows the way into its searches

A generated distribution SHALL present, on its first run and without the consumer editing anything,
a visible entry point to the command search and a visible entry point to the search over open work,
each naming the shortcut that also opens it. The two SHALL be placed apart from one another, so that
neither is read as a duplicate of the other.

This holds for what the generator emits, not for what the workbench requires: both entry points
remain the consumer's to move or delete, and a distribution that emits neither is still a valid one.

The notes a generator writes beside the generated product SHALL name both shortcuts and SHALL say
how to move an entry point to another bar, how to remove an entry point while keeping its search,
how to remove a search entirely, and how to bind one of the two shortcuts to a command of the
consumer's own. Where binding a shortcut has a way that resolves by registration order rather than
by intent, the notes SHALL name it as the way not to do it.

#### Scenario: A generated distribution offers both searches visibly

- **WHEN** a distribution is generated and served without further edits
- **THEN** the chrome shows an entry point to the command search and an entry point to the search
  over open work, each naming its shortcut

#### Scenario: The two entry points are not placed together

- **WHEN** a generated distribution renders its chrome
- **THEN** the two entry points sit in different bars

#### Scenario: The generated notes say how to take them away again

- **WHEN** a consumer reads the notes the generator wrote beside the generated product
- **THEN** they are told how to move each entry point, how to remove it while keeping its search,
  how to remove the search itself, and how to bind its shortcut to a command of their own

### Requirement: A route that cannot finish the wiring says what is left

Not every route a consumer uses can reach the workspace: one hands its output to an assistant or a
reader instead of writing it. Such a route SHALL name each remaining step in its output, stating what
happens if it is skipped, rather than producing files that are silently incomplete.

A remaining step SHALL be named at generation time and SHALL NOT be reachable only from a guide,
because a guide is not read at the moment the output is produced.

#### Scenario: A route that only emits content names the wiring it could not perform

- **WHEN** a route produces generated content without access to the workspace it is destined for
- **THEN** it names every workspace-level step the generated output still needs
- **AND** says what fails if each is skipped

#### Scenario: A route with workspace access leaves nothing to be named

- **WHEN** a route can write into the workspace
- **THEN** it performs that wiring rather than naming it

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

A generator MAY amend a file it does not own where the generated output cannot work without it, and
that file SHALL be one the generator names for itself rather than one derived from a consumer-supplied
target. An amendment SHALL add only what is absent, SHALL leave every value the consumer already chose
in place, and SHALL be reported in the same breath as what was written.

Where overwriting is permitted, it SHALL replace the entry in the target rather than following it
somewhere else. A target supplied by the consumer SHALL be refused where it would lead outside the
directory the generator was given; that refusal governs supplied targets, and does not extend to the
workspace files a generator names for itself.

#### Scenario: An existing file stops the run and is named

- **WHEN** something the generator would write already exists
- **THEN** the run stops, names it, and says how to proceed

#### Scenario: A trial run writes nothing and reports the refusals

- **WHEN** a trial run is requested
- **THEN** nothing is written
- **AND** the files a real run would refuse are named

#### Scenario: A trial run reports what would be amended as well

- **WHEN** a trial run is requested and a real run would amend a file the generator does not own
- **THEN** nothing is written or amended
- **AND** each file a real run would amend is named alongside the files it would write

#### Scenario: An amendment keeps the choice the consumer already made

- **WHEN** a generator amends a file in which the consumer already set one of the values it would add
- **THEN** the consumer's value stands
- **AND** only what was absent is added

#### Scenario: Overwriting does not write through a link

- **WHEN** overwriting is permitted and the target is a link
- **THEN** the entry in the target directory is replaced rather than what it points at

#### Scenario: A target leading outside the directory is refused

- **WHEN** a consumer-supplied target would resolve outside the directory the generator was given
- **THEN** it is refused

#### Scenario: A workspace file the generator names for itself is not refused

- **WHEN** generated output cannot work without a file the generator names, which sits above the
  directory it was given
- **THEN** that file is written or amended
- **AND** it is reported by name

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

Generated output that another generator's output must reference SHALL be composed in rather than left
for the consumer to connect, but only where the receiving file still presents the shape the platform
generated and the place to compose into is therefore unambiguous. Where it does not, the generator
SHALL leave that file untouched and SHALL name exactly what to add, because guessing at a consumer's
code is worse than asking for two minutes of their attention. A generator SHALL NOT report a
composition it did not perform as done.

#### Scenario: Adding to an existing project keeps its own declarations

- **WHEN** a generator composes into a project that already exists
- **THEN** what that project declared for itself is preserved

#### Scenario: An ambiguous target names the candidates

- **WHEN** more than one project could be the target
- **THEN** the generator names them rather than choosing

#### Scenario: Renaming an existing project is refused

- **WHEN** composing would rename the project already there
- **THEN** it is refused

#### Scenario: A generated plugin reaches the workbench it was generated beside

- **WHEN** a plugin is generated into a distribution whose composition root still presents the shape
  the platform generated
- **THEN** the plugin is registered there, with the permissions its own manifest declares
- **AND** serving the distribution shows the plugin's contributions in the chrome

#### Scenario: A composition root that cannot be recognised is named rather than guessed at

- **WHEN** a plugin is generated into a distribution whose composition root no longer presents that
  shape
- **THEN** that file is left untouched
- **AND** the generator names what to add to it
- **AND** it does not report the plugin as composed in

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
