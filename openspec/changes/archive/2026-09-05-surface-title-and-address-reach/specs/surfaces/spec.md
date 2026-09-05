## ADDED Requirements

### Requirement: A surface may be renamed while it is mounted

A plugin SHALL be able to give a surface it registered a new title without registering it again, and
everywhere the workbench names that surface SHALL follow: its tab, the header of the panel it is
docked in, and any picker that lists it. The surface itself SHALL NOT be rebuilt, so what the user
has typed, scrolled or folded inside it survives the rename.

The limit of that: a rename reaches the name only. Where a surface is drawn, what it draws and every
other thing its declaration carries are unaffected, and a rename of an id nothing was registered
under changes nothing.

#### Scenario: The name follows wherever the surface is named

- **WHEN** a plugin renames a surface it registered
- **THEN** the panel header naming that surface shows the new title

#### Scenario: The surface keeps what the user did in it

- **WHEN** a surface is renamed while the user has state inside it
- **THEN** the surface is not rebuilt and that state is still there

#### Scenario: A name given as a key is still translated

- **WHEN** a surface is renamed with a translation key and the language changes
- **THEN** the new name is shown in the new language

#### Scenario: Renaming something that was never registered does nothing

- **WHEN** a plugin renames an id it did not register
- **THEN** nothing changes and nothing is drawn differently
