## ADDED Requirements

### Requirement: Whoever opens a dialog chooses how the user may close it

Whoever opens a dialog with content of its own SHALL be able to choose which of the user's ways of
closing it work, from three: every way, only the deliberate ways, or none. The deliberate ways are
Escape, the dialog's close control and a cancel it offers; a click beside the dialog is the one way
that is not deliberate. Where nothing is chosen, every way SHALL work.

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

### Requirement: A dialog holding unsaved work asks before the user closes it

A dialog's content SHALL be able to report that it holds unsaved work, to offer to save it and to
veto closing, in the same way a tab's content can. While the content reports unsaved work, each way
of closing the user is allowed SHALL first ask the question closing a tab with unsaved work asks:
save, discard, or cancel, with save offered only where the content can save. Saving that fails SHALL
keep the dialog open. A content that is saving SHALL count as holding unsaved work until the save
has succeeded.

A veto SHALL be consulted before that question, and a veto that throws, rejects or does not answer
in time SHALL NOT make the dialog impossible to close, exactly as for a tab.

The limits of that: the content or the opener closing the dialog SHALL never ask, because whoever
closes it from code knows what it closes. A button the opener declared that closes the dialog with a
result is the content's deliberate outcome and SHALL NOT ask; one that closes it with no result is a
cancel and SHALL ask like any other. Content that reports nothing is never asked about, so a dialog
whose changes take effect as they are made closes as it does today.

#### Scenario: Every way of closing asks while work is unsaved

- **WHEN** a dialog allowing every way holds content reporting unsaved work, and the user presses
  Escape, clicks beside it or uses the close control
- **THEN** the question about unsaved work is asked, and the dialog stays open unless the user
  saves successfully or discards

#### Scenario: Save is offered only where the content can save

- **WHEN** the question is asked for content that reports unsaved work but offers no save
- **THEN** the question offers discard and cancel only

#### Scenario: Clean content closes without a question

- **WHEN** content that takes part reports no unsaved work, and the user closes the dialog
- **THEN** it closes at once, without a question

#### Scenario: A dialog that applies changes as they are made closes as before

- **WHEN** a dialog whose content reports nothing, such as one whose changes take effect as they are
  made, is closed by any way the user is allowed
- **THEN** it closes at once, without a question

#### Scenario: The content closing the dialog itself does not ask

- **WHEN** content reporting unsaved work closes its own dialog
- **THEN** it closes without a question

#### Scenario: A hanging veto cannot trap the user

- **WHEN** the content's veto neither answers nor fails, and the user closes the dialog
- **THEN** the user is offered to close it anyway, as for a tab

#### Scenario: What is not allowed is not asked about

- **WHEN** a dialog allowing only the deliberate ways holds content reporting unsaved work, and the
  user clicks beside it
- **THEN** nothing happens, and no question is asked
