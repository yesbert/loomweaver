## ADDED Requirements

### Requirement: A distribution may be served below a path of its origin

A distribution SHALL work when it is served below a path of its origin, beside other applications on
the same origin, provided its base names that path and its assets are served beside it. Everything
the workbench fetches or opens on the distribution's behalf SHALL resolve under that base and not
under the origin's root: the workbench's own strings, every contributed translation namespace, the
default directory of translation overlays, and the address of a pop-out window. A pop-out opened
under the base SHALL recognise itself as a pop-out there.

An overlay directory the distribution names relative to the application SHALL resolve under the base
as the default does. One it names from the origin's root SHALL be used as named, because the
distribution chose it.

A distribution served at the origin's root SHALL make exactly the requests it made before this
guarantee.

The guarantee covers what the workbench requests. Addresses a plugin or the distribution builds
themselves, such as the source of an isolated plugin, are theirs to resolve.

#### Scenario: Strings come from the distribution's own path

- **WHEN** a distribution whose base is `/x/` is served under `/x/` and starts in a language
- **THEN** the workbench's strings for that language are requested under `/x/`
- **AND** each contributed namespace is requested under `/x/` as well
- **AND** nothing is requested from the translation directory at the origin's root

#### Scenario: The default overlay directory follows the base

- **WHEN** a distribution under `/x/` opts into overlays without naming a directory
- **THEN** its overlays are requested from the default directory under `/x/`

#### Scenario: An overlay directory named from the origin's root is used as named

- **WHEN** a distribution under `/x/` names an overlay directory that starts at the origin's root
- **THEN** its overlays are requested from that directory, not from one under `/x/`

#### Scenario: A pop-out opens the same distribution

- **WHEN** a person opens a surface in a new window from a distribution under `/x/`
- **THEN** the new window's address lies under `/x/`
- **AND** the window starts as a pop-out of that distribution, showing that surface alone

#### Scenario: A distribution at the root is unchanged

- **WHEN** a distribution is served at the origin's root
- **THEN** its translations and its pop-out addresses are the ones it used before
