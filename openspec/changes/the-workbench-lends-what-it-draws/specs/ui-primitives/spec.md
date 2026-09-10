## ADDED Requirements

### Requirement: A settings row may be led by a symbol

A settings row SHALL be able to carry a symbol before its label, named the way every other symbol in
the workbench is named and resolved through the same registry, so that a product whose rows are led
by a symbol uses the workbench's row rather than a copy of it.

The symbol SHALL be decoration: what names the row for anyone not seeing it stays the label. A row
that names no symbol SHALL be drawn as it is without one, with no space held for it.

#### Scenario: A row that names a symbol shows it before the label

- **WHEN** a settings row names a symbol
- **THEN** it is drawn before the label, in the same size and colour the workbench gives a symbol
  beside text

#### Scenario: A row without one is unchanged

- **WHEN** a settings row names no symbol
- **THEN** the row is drawn as it was, with no gap where a symbol would be

#### Scenario: The symbol is not what the row is called

- **WHEN** a settings row carrying a symbol is read out
- **THEN** the label is what names it, and the symbol adds nothing to that
