## MODIFIED Requirements

### Requirement: Addressable content is gated at its address, and says why

Content with an address SHALL be refused when the session does not qualify. Visiting its address
SHALL keep the address and explain the situation rather than silently redirecting to a default
screen. A distribution MAY instead supply a destination to send unauthorized visits to, and MAY
decide per address.

This SHALL hold for every address the content answers, not only its root: an address below it that
names a sub-address, a child of a container, or a remainder the content owns SHALL be kept and
explained in the same way, and SHALL open at that sub-address once the session qualifies. A visit
that arrives before the session is known SHALL be treated no differently from one that arrives
after.

The explanation SHALL distinguish being signed out from being signed in without the necessary role,
because telling a signed-in user to sign in does not help them.

#### Scenario: An unqualified visit keeps its address and explains itself

- **WHEN** the session does not qualify for an address and the distribution supplies no destination
- **THEN** the address stays in the address bar
- **AND** the reason shown matches whether the user is signed out or merely lacks a role

#### Scenario: A distribution may redirect instead

- **WHEN** the distribution supplies a destination for unauthorized visits
- **THEN** an unqualified visit is sent there

#### Scenario: Content becomes reachable when the session qualifies

- **WHEN** the session gains the required role while its address is open
- **THEN** the content is shown without a reload

#### Scenario: An address below gated content survives a cold start

- **WHEN** an address below gated content, naming one of its sub-addresses or a child of a gated
  container, is opened directly as the application starts, before the session is known
- **THEN** no navigation error occurs and the address stays in the address bar
- **AND** once the session qualifies, the content opens at that sub-address, with that child in
  focus for a container

#### Scenario: An address below gated content is explained while the session does not qualify

- **WHEN** an address below gated content is opened and the session does not qualify
- **THEN** the address stays in the address bar and the reason is explained, as for the content's
  own address


#### Scenario: An address below gated content survives entering the workspace that claims it

- **WHEN** an address below gated content that a declared workspace claims is opened directly as the
  application starts, before the session is known, and that workspace declares an arrangement that
  holds other content of the same family, such as the content's own root
- **AND** the session then qualifies, so the claiming workspace becomes active
- **THEN** the content opens at that sub-address within the claiming workspace, not the other content
  its arrangement holds, whether or not an arrangement was stored for the person who signed in
