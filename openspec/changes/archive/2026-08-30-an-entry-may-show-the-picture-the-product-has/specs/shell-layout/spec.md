## ADDED Requirements

### Requirement: A chrome entry may be drawn as a picture of what it stands for

An entry contributed to a rail, and a button contributed to a bar, MAY carry a picture of what it
stands for, and the workbench SHALL draw that picture in its place. Where the entry carries none, or where the one it carries cannot be
shown, the workbench SHALL fall back to the short mark the entry declares, and to its icon where it
declares no mark. Falling back SHALL be the workbench's own doing, so a product that declares a
picture never has to handle the picture's absence, which is the ordinary case rather than the
exception.

The picture SHALL be decoration: the entry SHALL still be announced by its title, so that what the
picture stands for is not read a second time.

Whether a picture can be fetched at all SHALL stay the product's business, since the workbench
neither serves it nor knows where it comes from.

#### Scenario: An entry stands for a person and shows their picture

- **WHEN** a rail entry or a bar button carries a picture and it can be shown
- **THEN** the picture is drawn in place of the entry's icon and its short mark

#### Scenario: A picture that cannot be shown gives way

- **WHEN** the picture such a control carries fails to load
- **THEN** the control draws its short mark instead, or its icon where it declares no mark
- **AND** the control stays usable, with no broken image in the chrome

#### Scenario: The picture is not announced

- **WHEN** assistive technology reaches an entry drawn as a picture
- **THEN** the entry is announced by its title, and the picture adds nothing to that
