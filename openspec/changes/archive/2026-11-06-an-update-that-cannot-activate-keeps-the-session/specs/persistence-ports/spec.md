## MODIFIED Requirements

### Requirement: Adopting a namespace reads it before it writes to it

Where an anonymous session adopts an identity's namespace, the workbench SHALL read that namespace
again before writing to it. State stored for that person SHALL NOT be replaced by state built while
no person was known, whatever the user does next. The limit is an adoption given up for want of an
answer.

What was read from the anonymous namespace SHALL be superseded by what the adopted namespace holds.
For a key it holds nothing for, what the workbench holds SHALL stand and may be written.

#### Scenario: The arrangement stored for a person survives a late sign-in

- **WHEN** a person's arrangement is stored, the application is opened before the identity is known,
  and the identity becomes known afterwards
- **THEN** the arrangement stored for that person is what the workbench holds
- **AND** an ordinary change afterwards is written on top of it, not in place of it

#### Scenario: A person new to the product keeps what was built for them

- **WHEN** an anonymous session adopts a namespace that holds nothing
- **THEN** what the workbench holds stands and is written there

## ADDED Requirements

### Requirement: An adoption that does not answer is given up

An adoption that has not settled ten seconds after it began SHALL be given up. The workbench SHALL
then carry on in the person's namespace, and what was written during the adoption SHALL be stored
there as after an adoption that found nothing. Nothing from the anonymous namespace SHALL be copied
or deleted, and the user SHALL be told that local work could not be taken over and stays on this
device. A later session that begins anonymously SHALL adopt again.

#### Scenario: A port that never answers does not hold the session

- **WHEN** an anonymous session signs in and the adopted namespace never answers a read
- **THEN** after ten seconds writes reach the person's namespace and the user is told

#### Scenario: The anonymous data stays

- **WHEN** an adoption is given up
- **THEN** what the anonymous namespace holds is neither copied nor deleted

#### Scenario: An answer after the bound changes nothing

- **WHEN** the adopted namespace answers after the adoption was given up
- **THEN** nothing from the anonymous namespace is written to the person's namespace
