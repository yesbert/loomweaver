## ADDED Requirements

### Requirement: Values in an address are read decoded, and paths keep its encoded form

A parameter value a surface or a plugin reads out of an address SHALL be decoded. Every path the
workbench hands out SHALL be in the address's encoded form, as the address bar shows it. A segment
written with an encoding of its value SHALL stay one segment, open one tab and be read back as that
value. A path is never decoded for the reader; a value put back into a path is encoded again.

#### Scenario: A parameter is read decoded

- **WHEN** the address `people/M%C3%BCller` is shown on content declared as `people/:name`
- **THEN** the plugin reading what is shown, and the surface reading its address, read `name` as
  `Müller`
- **AND** a sandboxed surface is handed the same decoded value

#### Scenario: Every path is in the address's encoded form

- **WHEN** a plugin or a surface reads the address of what is shown, a tab's path, the segments of
  its own address, its sub-address or the remainder below the address it claims
- **THEN** each reads as the address bar shows it, `people/M%C3%BCller` rather than `people/Müller`,
  with the query string included where a remainder carries one

#### Scenario: A path written without encoding is held in the encoded form

- **WHEN** a plugin opens a tab at a path containing a non-ASCII character or a space, written as it
  is
- **THEN** the address, the tab's path and the path of what is shown all read in the encoded form
- **AND** navigating to the encoded address finds that tab rather than opening a second one

#### Scenario: An encoded value stays one segment

- **WHEN** a plugin opens content at a path whose segment is a value encoded in full, the value
  containing `/`, `?`, `#`, `;`, `(`, `)`, `%` or a space
- **THEN** the address has one segment for it and matches the declaration with one parameter there
- **AND** opening the same path again activates the same tab
- **AND** the parameter reads back as the value

#### Scenario: A value that is not a valid encoding is read as it stands

- **WHEN** a segment contains a percent sign that does not start a valid encoding
- **THEN** its parameter reads as the characters written
