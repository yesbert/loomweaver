## MODIFIED Requirements

### Requirement: The frame adapts to a narrow viewport

On a viewport too narrow for side panels, the workbench SHALL keep the launcher rail and present a
panel as an overlay that can be dismissed, rather than shrinking the content away.

On that same viewport the workbench's own top-bar entries SHALL take a compact form: the product's
mark SHALL stand alone without the product's name, and the language switcher SHALL show the
language by its symbol without its name. The width at which this happens SHALL be the one at which
the side panels become overlays, so that a narrow viewport is one condition and not two, and a
tablet held upright counts as narrow.

What is compacted is presentation only. The product's name and the language's name SHALL remain
the accessible names of those entries, so that nothing is lost to a screen reader that a sighted
user can still infer from the mark.

#### Scenario: A narrow viewport keeps the content usable

- **WHEN** the viewport is too narrow for a side panel beside the content
- **THEN** the panel is presented over the content and can be dismissed
- **AND** the launcher rail remains

#### Scenario: The top bar's own entries compact on a narrow viewport

- **WHEN** the viewport is narrow enough for the side panels to be overlays
- **THEN** the product's mark is shown without its name
- **AND** the language switcher shows the language's symbol without its name
- **AND** the entries after them in the bar are within the viewport

#### Scenario: The compact entries keep their names for assistive technology

- **WHEN** the product's mark and the language switcher are shown in their compact form
- **THEN** each is still announced by its full name

#### Scenario: A wide viewport is unchanged

- **WHEN** the viewport is wide enough for a side panel beside the content
- **THEN** the product's name and the language's name are shown as before

## ADDED Requirements

### Requirement: A bar too narrow to show everything stays usable

Where a bar cannot show every entry contributed to it at that entry's natural width, the workbench
SHALL fold the entries that do not fit into a control at the end of the bar, and that control SHALL
present the folded entries so that each can still be read and used. An entry SHALL NOT be drawn
over another, and SHALL NOT be cut off at the bar's edge.

Entries SHALL fold from the end of the bar backwards, the entry nearest the fold control first, so
that what a product placed first stays visible longest; within a slot the entry that declared the
highest order folds first. An entry that may shorten itself, such as the product's name, SHALL be
given the room to do so, but shortening SHALL NOT stand in for folding: folding happens so that
every entry that remains in the bar is shown at its natural width.

Folding SHALL follow the bar's width as it changes, in both directions: an entry folded on a
narrow window SHALL return to the bar once the window is wide enough for it. A bar in which every
entry fits SHALL look and behave as it does today, with no fold control shown.

The limit of this guarantee is the bar: a folded entry is presented by the fold control in the
form it has, and the workbench makes no attempt to abbreviate an entry it did not draw. This was
verified for entries the workbench draws from a declaration and for entries a product renders
itself, in the host-rendered chrome.

#### Scenario: Entries that do not fit are folded, not overlapped

- **WHEN** the entries contributed to a bar are wider than the bar
- **THEN** the entries that do not fit are absent from the bar and a fold control is shown at its end
- **AND** no two entries in the bar overlap and none is cut off

#### Scenario: A folded entry is still reachable

- **WHEN** the user opens the fold control
- **THEN** every folded entry is presented and can be used as it could in the bar

#### Scenario: The last entry folds first

- **WHEN** a bar has to fold one entry
- **THEN** it is the entry nearest the bar's end, the one with the highest order in the end slot

#### Scenario: Folding follows the width

- **WHEN** the window widens enough for a folded entry to fit
- **THEN** that entry returns to the bar, and the fold control disappears once nothing is folded

#### Scenario: A bar that fits is unchanged

- **WHEN** every entry of a bar fits its width
- **THEN** no fold control is shown and the bar looks and behaves as it did before
