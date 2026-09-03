# theming Specification

## Purpose
Everything the workbench draws takes its colour, its type and its shape from a named set of design
tokens, which is what lets a product look like itself without forking anything. Three parties may
set them — the product, the tenant deploying it and a plugin — and the interesting part is that
their precedence cannot be circumvented.

## Requirements

### Requirement: Everything visible is expressed in named tokens

The workbench SHALL draw its chrome exclusively from a fixed, named set of design tokens covering
colour and type, so that redefining a token re-colours everything drawn from it, including what
plugins draw with the workbench's own controls.

#### Scenario: Redefining a token reaches the whole application

- **WHEN** a token is redefined
- **THEN** every part of the workbench drawn from it changes, and so does every plugin control using
  the workbench's vocabulary

### Requirement: The workbench's visual vocabulary is available as named classes

Controls the workbench draws SHALL also be available to plugins as named style classes, so that a
plugin can produce a control that matches without importing anything from the workbench's own
framework. A class SHALL carry a usable default, so that omitting a modifier still yields a correct
control.

#### Scenario: A plugin's own markup produces a workbench control

- **WHEN** a plugin applies the named class to its own element
- **THEN** the element takes the workbench's appearance for that control

#### Scenario: Omitting a modifier is not a broken control

- **WHEN** a plugin applies only the base class
- **THEN** the control has its default size and spacing rather than none

### Requirement: A plugin may re-colour the application, once granted that

A plugin SHALL be able to contribute token values that re-colour the whole application, and SHALL
require an explicit capability to do so. Withdrawing the contribution SHALL restore what was there
before. A plugin MAY supply separate values for dark presentation.

#### Scenario: A plugin's theme reaches the whole application and reverts

- **WHEN** a plugin with the theming capability contributes token values
- **THEN** the workbench and every plugin surface change
- **AND** withdrawing the contribution restores the previous appearance

#### Scenario: A plugin without the capability cannot re-colour

- **WHEN** a plugin without the theming capability attempts to contribute tokens
- **THEN** it is refused

#### Scenario: Dark presentation can be themed separately

- **WHEN** a plugin supplies values for dark presentation
- **THEN** they apply in dark and the ordinary values apply in light

### Requirement: Precedence is product, then plugin, then tenant

Where more than one party sets a token, the tenant's value SHALL win over a plugin's, and a
plugin's over the product's default. This SHALL be enforced by the stylesheet's own layering rather
than by inspection, so that a plugin cannot escalate by writing a more specific rule.

#### Scenario: A tenant's branding cannot be overridden by a plugin

- **WHEN** a tenant sets a token and a plugin contributes a different value for it
- **THEN** the tenant's value is used

### Requirement: Only known tokens are accepted, and one owner holds each

A contribution SHALL be limited to the workbench's known tokens; anything else SHALL be ignored with
a warning rather than accepted. Where two plugins contribute the same token, the first SHALL keep it,
and the same owner SHALL hold it in both presentations so that a palette cannot end up split between
two contributors.

#### Scenario: An unknown token name is ignored, not applied

- **WHEN** a plugin contributes a name that is not a known token
- **THEN** it is ignored and the developer is told

#### Scenario: One owner holds a token in both presentations

- **WHEN** two plugins contribute the same token and one of them also supplies a dark value
- **THEN** the first contributor's values are used for both presentations

### Requirement: Light and dark follow the user, and can be read by a product

The user SHALL be able to choose light, dark, or to follow the system, and the choice SHALL survive
a restart. A product SHALL be able to read which of light or dark is currently in effect, so that
its own interface can match.

#### Scenario: Following the system is the default

- **WHEN** the user has never chosen
- **THEN** the workbench follows the system

#### Scenario: A product can mirror the effective presentation

- **WHEN** a product asks which presentation is in effect
- **THEN** it receives light or dark, never the "follow the system" choice itself

### Requirement: The user may change the text size, without overriding their browser

The user SHALL be able to change the size of the interface, and the choice SHALL survive a restart.
At the default size the workbench SHALL impose nothing, so that the browser's own setting decides.

#### Scenario: The default imposes nothing

- **WHEN** the text size is at its default
- **THEN** the workbench sets no size of its own and the browser's setting applies

#### Scenario: A stored value that is not usable falls back

- **WHEN** the stored size is not one the workbench offers
- **THEN** the default is used

### Requirement: A consumer is not required to adopt the workbench's styling toolchain

The workbench SHALL ship its styles precompiled, so that a distribution can use them with any
styling framework, or none. Those styles SHALL be arranged so that a consumer's own rules outrank
them without needing to force priority.

#### Scenario: A distribution uses its own styling framework

- **WHEN** a distribution imports the precompiled styles and uses a different styling framework
- **THEN** the workbench renders correctly

#### Scenario: A consumer's own rule wins without forcing

- **WHEN** a consumer writes a rule targeting a workbench control or element
- **THEN** it takes effect without needing to be marked as important

### Requirement: The precompiled styles carry no version of their own

The shipped stylesheet SHALL NOT embed a version number, because it is produced before the release
version is stamped and would otherwise disagree with the package that carries it.

#### Scenario: The stylesheet does not claim a version

- **WHEN** the stylesheet is produced
- **THEN** it contains no version of the platform

### Requirement: The text size is reachable to the distribution

The distribution SHALL be able to read the current text size as a reactive value and to set it from
its own code, choosing among the sizes the workbench offers. A size set from code SHALL be
remembered and applied exactly as one chosen from the built-in control, and the default SHALL
impose nothing, as for the user's own choice.

#### Scenario: A distribution's own control sets the size

- **WHEN** a component the distribution wrote sets a size the workbench offers
- **THEN** the interface takes that size, the choice survives a restart, and the built-in control
  shows it

#### Scenario: The fact follows the user

- **WHEN** a distribution binds its own control to the current size and the user changes it in the
  settings
- **THEN** the control re-renders with the new size without further wiring
