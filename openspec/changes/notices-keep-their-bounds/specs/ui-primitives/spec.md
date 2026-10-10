## MODIFIED Requirements

### Requirement: A plugin can raise a notice without owning where notices appear

A plugin SHALL be able to raise a transient notice with a kind, and the workbench SHALL place and
announce it. A notice raised by a plugin SHALL be identified in a way that cannot collide with the
workbench's own or with another plugin's.

A notice SHALL show its kind by a symbol and by colour, so that the kind is not carried by colour
alone. A raiser SHALL be able to name another symbol, named the way every other symbol in the
workbench is named and resolved through the same registry. The kind SHALL keep deciding the colour
and the urgency of the announcement whatever symbol is named, and the symbol SHALL be decoration:
what the notice says stays its wording.

#### Scenario: Two plugins raising notices do not collide

- **WHEN** two plugins raise notices using the same identity of their own
- **THEN** neither replaces the other's

#### Scenario: A plugin cannot spell its way to another raiser's notice

- **WHEN** a plugin's own name and the identity it chooses together spell the identity of a notice
  the workbench or another plugin raised
- **THEN** that notice is left as it is, and the plugin's is shown as a notice of its own

#### Scenario: The kind is visible without telling colours apart

- **WHEN** notices of two different kinds are shown
- **THEN** they differ in symbol as well as in colour

#### Scenario: A named symbol replaces the kind's, and nothing else

- **WHEN** a raiser names a symbol for a notice
- **THEN** the notice shows that symbol
- **AND** its colour and the urgency it is announced with are still those of its kind

### Requirement: A repeated notice is counted, not stacked

Where a raiser raises a notice with the kind, the wording and the symbol of one it raised before,
and that earlier notice is still shown or waiting, the workbench SHALL NOT add a second. The
earlier notice SHALL show how often it was raised, and its lifetime SHALL start over.

A notice its raiser gave an identity SHALL keep replacing the notice of that identity, as before,
and SHALL NOT be counted: naming a notice says it is one thing being updated, not a thing
happening again. Notices of two different raisers SHALL never be counted together.

The limit: a repeat by an isolated plugin is counted and does not start the lifetime over. That is
stated with the boundary it crosses.

#### Scenario: The same notice twice is one card

- **WHEN** the same raiser raises the same notice twice while the first is still shown
- **THEN** one notice is shown, saying it was raised twice

#### Scenario: A repeat restarts the lifetime

- **WHEN** a notice is repeated shortly before it would have left
- **THEN** it stays for a whole lifetime from the repeat

#### Scenario: A named notice is replaced, not counted

- **WHEN** a raiser raises a notice under an identity it used before
- **THEN** the earlier notice is replaced and no count is shown

#### Scenario: Two raisers saying the same are two notices

- **WHEN** two plugins raise notices with the same kind and wording
- **THEN** each is shown as its own notice
