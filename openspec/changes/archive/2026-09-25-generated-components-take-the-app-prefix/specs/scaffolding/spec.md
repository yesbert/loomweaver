## MODIFIED Requirements

### Requirement: Generated output is for the consumer's project, not the platform's

Generated code SHALL reference the published packages rather than any location inside the platform's
own repository, and SHALL take its naming, its placement and its import path from the workspace it is
generated into.

Where no naming prefix is supplied, generated components SHALL take the prefix the consumer's
application already declares, and where there is none to read, a neutral prefix, never the
platform's own. A product's components are then never mistaken for the elements the platform ships.

#### Scenario: Imports name the published packages

- **WHEN** any output is generated
- **THEN** it imports from the published packages

#### Scenario: The consumer's own conventions are followed

- **WHEN** output is generated into a workspace with its own naming scope
- **THEN** the generated import path uses that scope

#### Scenario: Placement is the consumer's decision

- **WHEN** a target directory, project name or naming prefix is supplied
- **THEN** the output is placed and named accordingly, at any depth

#### Scenario: Without a supplied prefix, the application's own is taken

- **WHEN** a weaver is generated without a naming prefix, on a route that reads the workspace, into a
  workspace whose composing application declares a prefix
- **THEN** its components are named with the application's prefix

#### Scenario: Nothing to read gives a neutral prefix, not the platform's

- **WHEN** output is generated without a naming prefix, and the application declares none or the
  route returns files without reading the workspace
- **THEN** its components carry a neutral prefix, and none carries the platform's own
