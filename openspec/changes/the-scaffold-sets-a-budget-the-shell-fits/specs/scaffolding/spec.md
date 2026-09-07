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

