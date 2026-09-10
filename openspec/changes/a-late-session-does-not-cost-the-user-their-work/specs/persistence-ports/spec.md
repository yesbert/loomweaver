## ADDED Requirements

### Requirement: Adopting a namespace reads it before it writes to it

Where an anonymous session adopts an identity's namespace, the workbench SHALL read the state it
holds again from the adopted namespace before writing any of it back there. State stored for that
person SHALL NOT be replaced by state the workbench built while no person was known, whatever the
user does next.

What was read from the anonymous namespace SHALL be superseded by what the adopted namespace holds.
Where the adopted namespace holds nothing for a key, what the workbench holds SHALL stand and may be
written: the person is new to this product, and nothing of theirs can be lost.

The re-read SHALL reach the state the workbench keeps for the user's arrangement and for anything
else it restored from the anonymous namespace before the adoption. A product SHALL NOT have to ask
for it, because a product cannot see the moment the adoption happens.

A product that answers the identity at the first read SHALL be unaffected: there is no adoption to
make, and nothing is read twice.

#### Scenario: The arrangement stored for a person survives a late sign-in

- **WHEN** a person's arrangement is stored, the application is opened before the identity is known,
  and the identity becomes known afterwards
- **THEN** the arrangement stored for that person is what the workbench holds
- **AND** an ordinary change afterwards is written on top of it, not in place of it

#### Scenario: A person new to the product keeps what was built for them

- **WHEN** an anonymous session adopts a namespace that holds nothing
- **THEN** what the workbench holds stands and is written there

#### Scenario: An identity known at the first read is read once

- **WHEN** a product answers the identity before the workbench first reads
- **THEN** the state is read once, from that identity's namespace
