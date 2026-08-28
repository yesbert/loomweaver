## MODIFIED Requirements

### Requirement: The workbench's own controls are available inside an isolated surface

The workbench SHALL make its element family, its style contracts and its symbol set available to an
isolated surface, served by the distribution so that their version always matches the workbench's.
A surface using them SHALL be indistinguishable from the workbench's own chrome.

What the distribution serves SHALL also be **described**: the controls, and the entry point through
which a surface reaches its symbols, its render state and its own store, SHALL come with a
machine-readable description of their shape, so that an author writing against them in a checked
language is told about a wrong name or a wrong argument before the surface runs. The description
SHALL be published with the thing it describes and carry its version, so the two cannot drift apart.

The description covers what the surface reaches through the served entry point. It does not make the
served bundle importable as a module: it is loaded by reference and installs itself, and that does
not change.

#### Scenario: A workbench control inside an isolated surface looks like one

- **WHEN** an isolated surface uses one of the workbench's elements or style classes
- **THEN** it renders as it does in the workbench's own chrome, including in dark presentation

#### Scenario: A plugin's own symbols work there too

- **WHEN** an isolated surface uses a symbol its plugin contributed
- **THEN** it renders alongside the workbench's own

#### Scenario: A surface author is told about a wrong call before it runs

- **WHEN** an author writes a surface in a checked language and calls the served entry point with a
  name or an argument it does not have
- **THEN** the mistake is reported while they are writing it, rather than as a failure inside the
  frame at run time

#### Scenario: The description travels with what it describes

- **WHEN** a distribution takes a given version of what the workbench serves to a frame
- **THEN** it receives the description of that same version, without asking for it separately
