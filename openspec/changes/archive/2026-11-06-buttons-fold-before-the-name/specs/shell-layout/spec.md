## MODIFIED Requirements

### Requirement: A bar folds its last entries first

Entries SHALL fold from the end of the bar backwards, the entry nearest the fold control first, so
that what a product placed first stays visible longest; within a slot the entry that declared the
highest order folds first. An entry that may shorten itself, such as the product's name, SHALL be
given the room to do so, but shortening SHALL NOT stand in for folding: every entry that remains in
the bar is shown at its natural width.

#### Scenario: The last entry folds first

- **WHEN** a bar has to fold one entry
- **THEN** it is the entry nearest the bar's end, the one with the highest order in the end slot

#### Scenario: The name is cut only once every entry that can fold has folded

- **WHEN** a bar holding the product's name runs out of room while other entries are still shown
- **THEN** those entries fold and the name is shown in full
- **AND** the name shortens only once no other entry is left in the bar
