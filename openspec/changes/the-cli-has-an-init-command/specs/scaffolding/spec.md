## ADDED Requirements

### Requirement: One command takes an existing application to a running product

A consumer with an existing Angular application or an Nx workspace SHALL be able to run one
command that leaves them with a product that serves: the platform's packages installed, the
distribution scaffolded and wired, and a first plugin composed in, so that the first serve shows a
workbench with something in its rail. The command SHALL do this without asking a question; every
choice it makes SHALL be overridable by an option with a stated default.

The command SHALL only add. Run a second time it SHALL change nothing and say so, and a value the
consumer already chose SHALL be kept. It SHALL name every file it wrote, every file it amended and
every package it installed, and it SHALL end by naming the command that serves the product.

The command SHALL NOT create the application. Outside an Angular application or an Nx workspace it
SHALL refuse with a message that names what it expected to find.

#### Scenario: An Angular CLI application becomes a product

- **WHEN** the command runs in the root of an Angular CLI application
- **THEN** the platform's runtime packages, the service worker matching the installed Angular
  version and the style pipeline are installed
- **AND** the distribution is scaffolded and the build is wired
- **AND** a first plugin is scaffolded and composed in
- **AND** the output ends with the command that serves it

#### Scenario: An Nx workspace becomes a product the Nx way

- **WHEN** the command runs in an Nx workspace with exactly one application
- **THEN** the result is what the Nx generators produce: the plugin is a registered project with
  an import alias, and the application composes it
- **AND** the output ends with the command that serves that application

#### Scenario: Several applications are named rather than guessed at

- **WHEN** the command runs in an Nx workspace with more than one application and no application
  is named
- **THEN** it stops before installing or writing anything and names the candidates

#### Scenario: The package manager is the consumer's

- **WHEN** the workspace carries a lockfile of npm, pnpm, yarn or bun
- **THEN** the packages are installed with that package manager, and the served command is
  spelled for it
- **AND** where no lockfile is present, npm is used and the output says so

#### Scenario: The first plugin can be declined

- **WHEN** the consumer asks for no first plugin
- **THEN** the distribution is produced without one, and the output says the rail will be empty
  until a plugin is composed in

#### Scenario: A trial run writes and installs nothing

- **WHEN** a trial run is requested
- **THEN** every package that would be installed, every file that would be written and every file
  that would be amended is named
- **AND** nothing is installed, written or amended

#### Scenario: A second run changes nothing

- **WHEN** the command runs again in a workspace it already took to a product
- **THEN** no file changes, no package is reinstalled, and the output says that nothing was left
  to do

#### Scenario: Outside a workspace it refuses

- **WHEN** the command runs in a directory that is neither an Angular application nor an Nx
  workspace
- **THEN** it writes nothing and names what it expected to find, and how to create it
