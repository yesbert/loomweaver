## ADDED Requirements

### Requirement: A literal is not a missing key

Wherever chrome text may be given either as a translation key or as a literal, a literal SHALL be
shown as it is and SHALL NOT be reported as a missing key. The workbench SHALL tell the two apart by
shape: a key is dot-separated segments of word characters, with at least one dot and no whitespace,
which is the shape of every key the workbench ships and of every contributed key, since a
contributed bundle is nested under its own name. A string of any other shape is a literal.

The limit of that: a literal that happens to have the shape of a key, such as a version written
with dots and nothing else, is reported like a key when no bundle knows it. That is the price of
telling them apart without a marker, and it is stated here so that nobody looks for a switch.

#### Scenario: A code, a name or a sentence stays silent

- **WHEN** a bar button's label is `DE`, a menu entry's name is `Deutsch` and a menu heading carries
  a person's first and last name, and a bundle for the active language has loaded
- **THEN** each is shown as it is and none is reported as missing

#### Scenario: A misspelt key is still reported

- **WHEN** a string with the shape of a key is looked up after a bundle for the active language has
  loaded and that bundle does not contain it
- **THEN** it is reported as missing, as before

#### Scenario: A literal shaped like a key is reported

- **WHEN** a literal such as `1.2.3` is looked up after a bundle has loaded
- **THEN** it is reported as missing, because nothing distinguishes it from a key
