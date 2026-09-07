## ADDED Requirements

### Requirement: A stand-in session can be generated that its user can operate

A session that stands in for an identity provider SHALL be generatable, and what is generated
SHALL be operable on the first serve without further edits: the user SHALL be able to sign in,
switch between the stand-in's accounts and sign out from the workbench's own chrome, and every
contribution that declares an access requirement SHALL follow the state so reached. Generating the
stand-in SHALL compose it into the product where the composition root still presents the shape the
platform generated, and SHALL name what to add where it does not, under the same rule every
generator follows for composing into what is already there.

The stand-in SHALL say what it is, in the generated source, and SHALL be confined to what a product
replaces when its own session arrives, so that mapping a real session into the same seam leaves the
rest standing. A consumer SHALL be able to ask for the session's shape alone, without the controls,
for a product that has a session of its own to map.

The limit of that: the stand-in is presentation. Nothing generated protects anything, and the
generated source SHALL say so.

#### Scenario: A generated stand-in works from the rail on the first serve

- **WHEN** a stand-in session is generated into a distribution whose composition root still presents
  the shape the platform generated, and the distribution is served without further edits
- **THEN** the rail offers sign-in to a visitor, and switching and signing out to a signed-in user
- **AND** a contribution gated on being signed in appears after signing in and disappears after
  signing out

#### Scenario: A composition root that cannot be recognised is named rather than guessed at

- **WHEN** a stand-in session is generated into a distribution whose composition root no longer
  presents that shape
- **THEN** that file is left untouched, the generator names what to add to it, and it does not report
  the stand-in as composed in

#### Scenario: The shape alone can be asked for

- **WHEN** a consumer asks for the stand-in's shape alone
- **THEN** the session source is generated and no control is, and nothing is composed into the
  product
