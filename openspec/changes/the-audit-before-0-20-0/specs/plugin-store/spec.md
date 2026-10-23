## ADDED Requirements

### Requirement: A catalogue entry's identity has a form, and the workbench's is reserved

A catalogue entry's identity SHALL consist of lower-case letters, digits, dots and hyphens, beginning
with a letter or digit. An identity outside that form, or one in the workbench's own namespace, SHALL
be refused, both when the catalogue is read and when what was installed is read back, so that an
installed plugin can neither take the place of the workbench's own sections nor reach another
plugin's stored values by the shape of its name.

#### Scenario: An entry that claims the workbench's namespace is refused

- **WHEN** the catalogue offers an entry whose identity is the workbench's own
- **THEN** it is not offered, and the catalogue check names the reason and what it costs

#### Scenario: An identity outside the form is refused

- **WHEN** the catalogue offers an entry whose identity contains a colon, a space or an upper-case
  letter
- **THEN** it is not offered

#### Scenario: Altered stored state cannot bring such an identity back

- **WHEN** the stored record of installed plugins is altered to hold an identity outside the form
- **THEN** that entry is not loaded
