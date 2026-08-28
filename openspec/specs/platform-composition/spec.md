# platform-composition Specification

## Purpose
An application built on this platform is a composition: a thin, domain-pure workbench plus the
plugin bundles a product chooses to include. The platform's most important properties are things it
refuses to contain — domain logic and a server — because both are what keep a plugin platform from
slowly becoming an application with a plugin system bolted on.

## Requirements

### Requirement: The platform contains no domain logic

The platform SHALL contain nothing specific to any product built on it. A product's features SHALL
reach the workbench through the same plugin contract a third party would use, with no privileged
path, and the build SHALL enforce that the platform never depends on a product's code.

#### Scenario: A product's own features cannot be reached from the platform

- **WHEN** platform code attempts to depend on a product's plugin bundle
- **THEN** the build fails

#### Scenario: A product bundle depends only on the contract

- **WHEN** a product's plugin bundle is built
- **THEN** it may depend on the author contract and not on the workbench's implementation

### Requirement: The platform ships no server

The platform SHALL consist of a frontend and its contracts. Where a product needs a server —
for settings, for identity, for per-tenant secrets, for credentialed outbound calls — that server
is the product's, and the platform SHALL express the seam only as replaceable frontend ports with
local defaults, so that the workbench runs standalone.

#### Scenario: The workbench runs with no backend at all

- **WHEN** a distribution is built and served with no server behind it
- **THEN** the workbench works, storing state locally and treating the session as anonymous

#### Scenario: A product's backend attaches without changing the workbench

- **WHEN** a product implements the ports against its own backend
- **THEN** no other part of the composition changes

### Requirement: A composition is one product, assembled at build time

An application SHALL present itself as exactly one product, assembled by composing the workbench
with the plugin bundles and the product's own decisions. Which bundles are present is a property of
the composition, not something the workbench discovers.

#### Scenario: A distribution declares what it is made of

- **WHEN** an application is composed
- **THEN** its identity, its regions, its plugin bundles and its port implementations are all
  declared in one place

### Requirement: Framework freedom lives at the plugin boundary

A plugin SHALL be able to be written in any web technology. The platform SHALL provide that freedom
at the boundary — as framework-neutral custom elements for in-page use, and as an isolated document
for anything else — rather than by making the workbench itself framework-agnostic.

How plugin code is *loaded* SHALL be independent of this: a loading mechanism is a transport and
grants no interoperability of its own.

#### Scenario: A plugin written in another technology works

- **WHEN** a plugin is written without the workbench's own framework and delivered as an isolated
  document
- **THEN** it contributes and renders through the same contract

#### Scenario: Consumers are not forced onto the workbench's styling toolchain

- **WHEN** a product builds a distribution
- **THEN** it may use the workbench's precompiled styles and its own styling framework instead of
  adopting the workbench's

### Requirement: The published contract is what consumers can rely on

What the platform publishes SHALL be a deliberate, documented surface. Every published name SHALL
appear in the consumer documentation, and every promise a package manifest makes about its contents
SHALL be kept by what it actually ships. Both SHALL be checked automatically.

#### Scenario: An undocumented published name is caught

- **WHEN** a name is added to a published package and documented nowhere
- **THEN** the check fails, naming it

#### Scenario: A manifest promise with nothing behind it is caught

- **WHEN** a package manifest points at a file the package does not contain
- **THEN** the check fails, naming the promise

### Requirement: A composition can be asked what is wrong with it

The workbench SHALL be able to report, during development, the mistakes a composition can make
silently: a contribution aimed at a region the layout does not declare or that is of the wrong kind,
a removal instruction that matched nothing, and a control pointing at an action nothing registers.

A removal instruction that *did* remove something SHALL NOT be reported, and the report SHALL say so
plainly when it finds nothing.

#### Scenario: A control pointing at nothing is named

- **WHEN** a button names an action that nothing registers, or that a removal instruction took away
- **THEN** the report names it

#### Scenario: A removal instruction that matched nothing is named, with a suggestion

- **WHEN** a removal instruction matches nothing
- **THEN** the report names it
- **AND** where a differently-prefixed form would have matched, it says so

#### Scenario: A sound composition is told it is sound

- **WHEN** nothing is wrong
- **THEN** the report says so rather than staying silent

#### Scenario: The report does not displace something already there

- **WHEN** the report installs its entry point and something of the same name already exists
- **THEN** the existing one is left alone

### Requirement: A plugin never chooses how it is served

A plugin SHALL address one uniform context, and the workbench SHALL decide how each call is served.
The same contract SHALL therefore hold whether a plugin runs in the page or isolated from it, and a
plugin SHALL NOT be able to tell the difference from the shape of what it calls.

#### Scenario: The same plugin code works at either isolation level

- **WHEN** the same contribution is made by a plugin running in the page and by one running isolated
- **THEN** both reach the workbench through the same contract members

#### Scenario: Routing is not part of the plugin's decision

- **WHEN** a plugin uses its context
- **THEN** nothing in the call names a transport or a destination

### Requirement: The specification is the contract, and is the only place a guarantee is stated

What the platform guarantees SHALL be stated in its capability specifications and nowhere else.
Documentation, contract comments and agent-facing files MAY restate a guarantee for a reader, but
SHALL be derived from the specification rather than maintained beside it; where the two disagree,
the specification is right and the other is a defect.

A change to what the platform guarantees SHALL be made as a change against the capability, with its
reasoning in that change's design note, so that the reasoning survives without becoming a second
source.

#### Scenario: A guide and a specification disagree

- **WHEN** a consumer guide states something the specification does not
- **THEN** the specification governs, and the guide is corrected

#### Scenario: A behaviour change is proposed

- **WHEN** behaviour is to change
- **THEN** it is proposed as a change against the capability that owns it, carrying both the new
  guarantee and the reasoning for it
