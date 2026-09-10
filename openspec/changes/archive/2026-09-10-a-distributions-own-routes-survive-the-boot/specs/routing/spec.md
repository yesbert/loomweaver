## ADDED Requirements

### Requirement: Addresses a distribution owns keep resolving

A distribution SHALL be able to declare addresses of its own beside the ones plugins contribute — a
redirect for the address that names no content, a legal page, a sign-in page — and those addresses
SHALL resolve for as long as the application runs.

The guarantee SHALL survive the moment the contributed addresses are put in place and every later
change to them, so that a plugin arriving, being enabled, being disabled or being omitted never
takes a distribution's own address away.

An address the distribution owns SHALL be shown in the content area without becoming part of the
arrangement: no tab is opened for it, and the panes keep what they were showing. What it does with
the address afterwards is the distribution's own affair; a redirect it declares SHALL take effect
like any other navigation.

A catch-all the distribution declares SHALL answer only where nothing else does, so that a page for
addresses that name nothing never swallows the addresses plugins contribute.

Where the distribution and a plugin declare the same address, the distribution's SHALL answer,
because the distribution composes the product and cannot otherwise correct what it ships. In
development the developer SHALL be told which address is declared twice, so that a shadowed plugin
surface is not a silent surprise.

#### Scenario: The distribution's own address resolves once the plugins are in place

- **WHEN** a distribution declares an address of its own, and plugin-contributed content addresses
  are put in place at start-up
- **THEN** the distribution's address still resolves

#### Scenario: A redirect for the bare address takes effect

- **WHEN** a distribution declares that the address naming no content leads elsewhere, and the
  application is opened at that address
- **THEN** the application ends up where the distribution said

#### Scenario: A later change to the contributed addresses leaves it alone

- **WHEN** a plugin is enabled or disabled after start-up, and the contributed addresses are put in
  place again
- **THEN** the distribution's own addresses still resolve

#### Scenario: An address the distribution owns opens no tab

- **WHEN** an address the distribution owns is reached
- **THEN** it is shown in the content area
- **AND** no tab is opened for it and the arrangement is unchanged

#### Scenario: A catch-all the distribution declares stays last

- **WHEN** a distribution declares a page for addresses that name nothing, and a plugin contributes
  content at an address of its own
- **THEN** the plugin's content is what its address resolves to
- **AND** an address neither of them declares reaches the distribution's page

#### Scenario: The distribution wins an address a plugin also declares

- **WHEN** a distribution and a plugin declare the same address
- **THEN** the distribution's is what the address resolves to
- **AND** the developer is told, in development, which address is declared twice
