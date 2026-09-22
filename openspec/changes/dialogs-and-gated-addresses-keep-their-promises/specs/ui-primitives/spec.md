## MODIFIED Requirements

### Requirement: A dialog holds focus and gives it back

While a dialog is open, keyboard focus SHALL stay within it in both directions, and on closing it
SHALL return to what had focus before. The return SHALL hold however the dialog closes, whether by
the user, by its content or by whoever opened it, and SHALL take effect once the dialog is gone, so
that nothing the dialog still covers can swallow it. A dialog SHALL be able to align itself to the
top of the viewport rather than the centre, for content whose height changes as the user types.

The limit of that: focus returns to what had it only while that is still on the page and can take
focus.

#### Scenario: Focus cycles within the dialog

- **WHEN** the user moves focus past the last control, or backwards past the first
- **THEN** focus wraps within the dialog

#### Scenario: Focus returns to the opener however the dialog closes

- **WHEN** a control has focus and opens a dialog with content of its own, and the dialog is then
  closed by Escape, by its close control, or by its content closing it
- **THEN** after the dialog has left the page, focus is on that control and not on the page body

#### Scenario: A dialog whose content grows does not jump

- **WHEN** a dialog declares itself top-aligned
- **THEN** it is pinned to the top rather than re-centring as its height changes

### Requirement: Whoever opens a dialog chooses how the user may close it

Whoever opens a dialog with content of its own SHALL be able to choose which of the user's ways of
closing it work, from three: every way, only the deliberate ways, or none. The deliberate ways are
Escape, the dialog's close control and a cancel it offers; a click beside the dialog is the one way
that is not deliberate. Where nothing is chosen, every way SHALL work.

An Escape that closes a list or a menu open inside the dialog SHALL close that alone and SHALL NOT
count as a way of closing the dialog; the next Escape, with nothing open inside, closes the dialog
as the choice allows.

Where the workbench draws the dialog's frame, the close control SHALL be drawn whenever the
deliberate ways work, so that refusing a click beside the dialog does not cost the dialog its frame.
A dialog whose content draws its own frame draws its own close control, and the choice still governs
Escape and a click beside it.

The limit of that: the choice governs the user and nothing else. The dialog's own content and
whoever opened it SHALL always be able to close it, whatever was chosen.

#### Scenario: A form ignores a click beside it and still closes deliberately

- **WHEN** a dialog is opened allowing only the deliberate ways, and the user clicks beside it
- **THEN** the dialog stays open
- **AND** Escape and the close control each close it as a cancel, and the close control is drawn

#### Scenario: A dialog that allows every way closes on a click beside it

- **WHEN** a dialog is opened with nothing chosen, and the user clicks beside it
- **THEN** the dialog closes as a cancel

#### Scenario: A dialog that allows no way closes only from its code

- **WHEN** a dialog is opened allowing no way, and the user presses Escape or clicks beside it
- **THEN** the dialog stays open, no close control is drawn, and it closes when its content or its
  opener closes it

#### Scenario: Escape in an open list closes the list, not the dialog

- **WHEN** a dialog allowing Escape holds a select or a menu, the user opens its list, and presses
  Escape
- **THEN** the list closes and the dialog stays open, without asking about unsaved work
- **AND** a second Escape closes the dialog as the choice allows
