## MODIFIED Requirements

### Requirement: Generated output builds, passes its own checks, and needs no repair

What a generator produces SHALL compile against the published contract and SHALL pass the checks the
platform's own conventions impose, including its own naming and its own style rules. It SHALL NOT
require a consumer to fix it before it works.

Producing sources alone does not satisfy this. Where generated output needs configuration elsewhere in
the workspace before it runs, a generator with access to that workspace SHALL produce that
configuration too. A build that reports success while the generated product does not work SHALL be
treated as the same defect as a build that fails, because it hides rather than reports.

Where generated output needs a package the consumer's project does not already carry, that need SHALL
be met rather than assumed. A route that can reach the workspace SHALL record the dependency there; a
route that cannot SHALL name it among the steps that remain. Output naming a package nobody installs
does not compile, which is the same defect as output that does not build.

This holds for the generated product as it is served, not only as it is compiled: the workbench's
chrome SHALL render with its own styles applied and its own strings resolved, and nothing the
generator itself put in place SHALL contradict anything else it put in place.

It holds for the generated product's tests as well. Where the workspace runs unit tests, the tests
present after a distribution is generated SHALL pass without further edits, including any starter
test the workspace carried before the generator ran that the generated output made false; the
generator SHALL replace such a test rather than leave the consumer to delete it.

A limit the generator itself replaces SHALL remain a limit. Where a default the generated output
invalidates is a threshold, the generator SHALL set one the generated output fits and a consumer's
own growth can still exceed, rather than one placed beyond reach; a threshold nothing can cross
reports nothing.

#### Scenario: A generated project passes its own lint

- **WHEN** a project is generated with a non-default naming prefix
- **THEN** it passes the very lint rules the generator itself emitted

#### Scenario: A generated project has something to test

- **WHEN** a project is generated in a workspace that runs unit tests
- **THEN** it is wired for tests and has a starter test to run

#### Scenario: A workspace that tests differently gets no test wiring

- **WHEN** a project is generated in a workspace that runs no unit tests
- **THEN** no test wiring and no starter test are emitted

#### Scenario: A generated distribution's tests pass without further edits

- **WHEN** a distribution is generated into a fresh application workspace that runs unit tests, and
  the workspace's tests are run without further edits
- **THEN** every test passes
- **AND** the application's starter test now boots the workbench rather than the page the
  application had before

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

#### Scenario: A package the generated output needs is installed where that is possible

- **WHEN** generated output needs a package the consumer's project does not carry, and the route can
  reach the workspace
- **THEN** the dependency is recorded there rather than left to the consumer

#### Scenario: A route that cannot install names the package instead

- **WHEN** the same output is produced by a route that cannot reach the workspace
- **THEN** the package is named among the steps that remain, together with what fails if it is skipped

#### Scenario: A generated distribution is built for release without a threshold it cannot meet

- **WHEN** a distribution is generated into a fresh application workspace and built for release
  without further edits
- **THEN** the build completes
- **AND** no size threshold the workspace carried before the generator ran stops it

#### Scenario: A threshold the generator sets can still be exceeded

- **WHEN** a distribution is generated and the consumer's own code grows well past what the
  generated output itself weighs
- **THEN** the build reports it

#### Scenario: The generated notes agree with what was generated

- **WHEN** a consumer reads the notes generated beside a weaver
- **THEN** every region they name is one the generated contributions target and the generated
  layout declares, with the kind the notes give it
- **AND** where they tell the consumer to install a package, they ask for the version range the
  generator records in the workspace or names as a remaining step

#### Scenario: A style configuration the generator cannot amend is named

- **WHEN** a distribution is generated into a workspace whose style pipeline configuration the
  generator cannot amend safely, such as one written as code
- **THEN** that configuration is left untouched
- **AND** whichever route generated it names what to add, and that the workbench renders unstyled
  until it is added

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

Composing a second plugin in SHALL leave every plugin composed in before it working. What the
generator adds for one plugin SHALL NOT replace, shadow or disable what it added for another.

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

#### Scenario: A second generated plugin leaves the first one working

- **WHEN** two plugins are generated one after the other into the same distribution, and it is
  served without further edits
- **THEN** both activate with the permissions their manifests declare
- **AND** the contributions of both are in the chrome

#### Scenario: A composition root that cannot be recognised is named rather than guessed at

- **WHEN** a plugin is generated into a distribution whose composition root no longer presents that
  shape
- **THEN** that file is left untouched
- **AND** the generator names what to add to it
- **AND** it does not report the plugin as composed in

#### Scenario: A nested package is not taken for the workspace

- **WHEN** output is generated into a directory inside a workspace, below a folder that carries a
  package manifest of its own but no workspace configuration
- **THEN** the workspace above it is found and wired, as it would be from the workspace root
- **AND** a package the output needs is recorded in that workspace, not in the nested package
