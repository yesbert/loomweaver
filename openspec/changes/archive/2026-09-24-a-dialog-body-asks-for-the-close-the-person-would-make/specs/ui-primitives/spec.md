## MODIFIED Requirements

### Requirement: A dialog holding unsaved work asks before the user closes it

A dialog's content SHALL be able to report that it holds unsaved work, to offer to save it and to
veto closing, in the same way a tab's content can. While the content reports unsaved work, each way
of closing the user is allowed SHALL first ask the question closing a tab with unsaved work asks:
save, discard, or cancel, with save offered only where the content can save. Saving that fails SHALL
keep the dialog open. A content that is saving SHALL count as holding unsaved work until the save
has succeeded.

A veto SHALL be consulted before that question, and a veto that throws, rejects or does not answer
in time SHALL NOT make the dialog impossible to close, exactly as for a tab.

The content SHALL also be able to ask for the close the person would make, from a control of its
own such as a cancel beside its other buttons. That request SHALL run the veto and ask the same
question the close control asks, whatever the opener chose for the person's ways of closing, and
SHALL answer whether the dialog closed: yes once it has closed, no where the person cancelled, a
save failed or the veto held. A request made while the question is already asked SHALL NOT ask a
second time.

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

#### Scenario: The content's own cancel asks like the close control

- **WHEN** content reporting unsaved work asks for the person's close from a button of its own
- **THEN** the question about unsaved work is asked, as the close control asks it

#### Scenario: Cancelling the question keeps the dialog and says so

- **WHEN** the person cancels that question
- **THEN** the dialog stays open and the content learns that it did not close

#### Scenario: Clean content closes at once when it asks

- **WHEN** content reporting no unsaved work asks for the person's close
- **THEN** the dialog closes at once, without a question, and the content learns that it closed

#### Scenario: Saving from the question closes after the save

- **WHEN** content that can save asks for the person's close and the person chooses to save
- **THEN** the dialog closes once the save succeeds, and stays open where it fails

#### Scenario: The request works where the person's ways are limited

- **WHEN** a dialog that allows the person no way of closing holds content that asks for the
  person's close
- **THEN** the request is handled as if the close control had been used
