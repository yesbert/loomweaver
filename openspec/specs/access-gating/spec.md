# access-gating Specification

## Purpose
The platform owns no sign-in: it has no login screen, no session store and no identity provider,
and it never will, because those belong to the product. What it does own is the reaction — every
contributed thing can say who it is for, and the workbench keeps the interface honest as the session
changes underneath it.

## Requirements

### Requirement: The workbench consumes a session it does not own

The workbench SHALL take the current session from a replaceable source supplied by the product, and
SHALL treat the session as anonymous when no source is supplied. It SHALL NOT provide sign-in,
sign-out, credential storage or an identity provider.

Roles SHALL be opaque strings the workbench compares but never interprets. A session MAY also
carry claims; the workbench passes them through to plugins and does not evaluate them in any
requirement of its own.

#### Scenario: An application with no auth runs anonymously

- **WHEN** no distribution supplies a session source
- **THEN** the workbench treats every request as anonymous and gates accordingly

#### Scenario: The session is followed as it changes

- **WHEN** the supplied session changes
- **THEN** the workbench reflects the new session without being told to re-read it

### Requirement: A contribution declares who it is for, and the workbench enforces it

Anything a plugin contributes SHALL be able to declare a requirement on the session: that a user is
signed in at all, that they hold any one of a set of roles, or that they hold all of them. The
plugin declares; the workbench draws or refuses. A contribution MAY ask to be hidden when the
requirement is unmet, or shown but inoperable.

#### Scenario: An unmet requirement hides the contribution

- **WHEN** a contribution asks to be hidden and its requirement is unmet
- **THEN** it is absent from the interface

#### Scenario: An unmet requirement can instead disable the contribution

- **WHEN** a contribution asks to be shown but inoperable and its requirement is unmet
- **THEN** it is drawn and cannot be used

#### Scenario: The declaration is enforced by the workbench, not by the plugin

- **WHEN** a plugin declares a requirement
- **THEN** the workbench applies it, including for plugins that run isolated and could not enforce
  it themselves

#### Scenario: A requirement may also ask for an anonymous session

- **WHEN** a contribution requires that the user is *not* signed in
- **THEN** it is present while anonymous and absent once signed in

### Requirement: Every surface that shows a contribution reacts to the session

The reaction SHALL be uniform across the workbench: launcher entries, bar items, docked view tabs,
the actions on a view, commands, the command palette, keyboard shortcuts, addressable content, the
pickers that offer content for a pane, and what may be dragged into one.

#### Scenario: A command is unreachable by every route when its requirement is unmet

- **WHEN** a command's requirement is unmet
- **THEN** it is absent from the palette
- **AND** its keyboard shortcut does nothing
- **AND** an item pointing at it does not run it

#### Scenario: A picker offers only what the session may open

- **WHEN** the user opens a picker to choose content for a pane
- **THEN** it offers only content the session qualifies for

#### Scenario: The interface follows a change of session without a reload

- **WHEN** the session gains or loses a role
- **THEN** contributions appear and disappear accordingly, without a reload

### Requirement: Addressable content is gated at its address, and says why

Content with an address SHALL be refused when the session does not qualify. Visiting its address
SHALL keep the address and explain the situation rather than silently redirecting to a default
screen. A distribution MAY instead supply a destination to send unauthorized visits to, and MAY
decide per address.

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

### Requirement: A plugin may read the session, once it has been granted that

A plugin SHALL be able to read whether a user is signed in and which roles they hold, so it can gate
its own interior. This SHALL require the session capability like any other part of the context, and
the value SHALL be reactive.

A plugin that runs isolated cannot read the session for itself, so the workbench SHALL send it —
and only where the plugin holds the capability. Withdrawing it SHALL stop the sending immediately.

#### Scenario: A plugin's own interior follows the session

- **WHEN** the session changes and a plugin reads it
- **THEN** what the plugin draws follows

#### Scenario: Reading the session without the capability is refused

- **WHEN** a plugin without the session capability reads the session
- **THEN** it is refused

#### Scenario: An isolated surface is sent the session, and only when granted

- **WHEN** an isolated plugin surface holds the session capability
- **THEN** the workbench sends it the sign-in state and roles
- **AND** withdrawing the capability stops the sending while the surface is shown

#### Scenario: Not granted is not the same as signed out

- **WHEN** an isolated surface does not hold the session capability
- **THEN** it is sent no session at all, rather than an anonymous one

### Requirement: This gating is presentation, not enforcement

The workbench's gating SHALL be understood as keeping the interface honest, not as a security
boundary: everything it decides happens in the browser, where the user controls the code. A product
MUST enforce access at its own backend as well.

#### Scenario: Gating does not stand in for server-side authorisation

- **WHEN** content is hidden because the session does not qualify
- **THEN** nothing about the underlying data is thereby protected
