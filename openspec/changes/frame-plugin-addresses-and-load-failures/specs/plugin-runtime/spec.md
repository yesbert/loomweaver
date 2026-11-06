## MODIFIED Requirements

### Requirement: Replacing a contribution is not open to a plugin outside the application's own code

A plugin that does not run as the application's own code SHALL NOT replace a contribution another
owner registered, nor take an address that lies under one another owner holds. Such a registration
SHALL be refused and reported, naming both owners and, for an address, both addresses; the first
owner keeps it. The home address counts as no one's. It may replace its own.

#### Scenario: An installed plugin aims at the product's address

- **WHEN** a plugin installed from the catalogue registers content at an address the product's own
  plugin already answers
- **THEN** the registration is refused, the product's content stays, and the developer is told which
  plugin asked and which one holds the address

#### Scenario: An installed plugin aims below another owner's address

- **WHEN** a frame plugin registers content at `orders/:id` while the product or another plugin
  holds `orders`
- **THEN** the registration is refused, and the developer is told both addresses and both owners
- **AND** the same plugin may still register below an address of its own

#### Scenario: An installed plugin replaces what it registered itself

- **WHEN** that plugin registers a contribution under an id it registered before
- **THEN** its later contribution replaces its earlier one

#### Scenario: The distribution still overrides

- **WHEN** the distribution or a plugin composed into the application registers an item whose id
  matches one already contributed
- **THEN** the later item is the one shown
