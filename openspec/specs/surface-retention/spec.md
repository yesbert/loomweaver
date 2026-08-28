# surface-retention Specification

## Purpose
Hiding something is not closing it. A user who splits a pane, switches a tab or collapses a sidebar
expects to come back to what they were doing, and the workbench has to decide — for every surface,
at every one of those moments — whether to keep it alive or let it go. One rule covers all of them:
a hidden surface is destroyed as soon as it is clean, and unsaved work is what keeps it alive.

## Requirements

### Requirement: A hidden surface is destroyed once it is clean

When a surface stops being visible the workbench SHALL destroy it, unless it says it has unsaved
work or its declaration asks to be kept. This SHALL apply uniformly to every way of hiding
something: switching what a pane shows, collapsing a panel, blowing up another pane, and moving
between arrangements.

#### Scenario: An ordinary surface does not linger

- **WHEN** a surface with nothing unsaved is hidden
- **THEN** it is destroyed, and rebuilt when it is shown again

#### Scenario: Collapsing a panel really unmounts what was in it

- **WHEN** a panel is collapsed
- **THEN** its content leaves the document rather than being hidden in place

#### Scenario: The same rule applies on a narrow viewport

- **WHEN** the overlay panel of a narrow viewport is closed
- **THEN** it holds no content

### Requirement: Unsaved work keeps a surface alive, and nothing else has to

A surface SHALL be able to report that it has unsaved work, and while it does the workbench SHALL
NOT destroy it when hiding it. Because reporting it also guards closing, hiding SHALL never need to
be blocked or questioned.

#### Scenario: A draft survives an ordinary gesture

- **WHEN** a surface with unsaved work is hidden by switching away and shown again
- **THEN** the unsaved work is still there

#### Scenario: Hiding is never interrupted

- **WHEN** a surface with unsaved work is hidden
- **THEN** it happens immediately, with no prompt

#### Scenario: Becoming clean lets it go

- **WHEN** a hidden surface with unsaved work is saved
- **THEN** it is destroyed, without having to be shown again

### Requirement: A surface may ask to be kept regardless

A declaration MAY ask that its surface always be kept while hidden, or never be. A distribution MAY
change the default for everything it composes, and a surface's own declaration SHALL win over that
default.

Being hidden by a switch of workspace SHALL count as being hidden, so a kept surface parked by such a
switch SHALL be found alive when its workspace is chosen again. Where the surface is an isolated one,
that also means its channel SHALL still be the one it had, so no handshake is repeated and nothing it
was told has to be pushed again.

#### Scenario: A surface that asks to be kept is kept

- **WHEN** a surface whose declaration asks to be kept is hidden
- **THEN** it is not destroyed

#### Scenario: A workspace switch parks a kept surface rather than ending it

- **WHEN** the user switches to another workspace and back, and the first held a surface that asks to
  be kept
- **THEN** that surface is the one that was there, with what the user had done in it intact

#### Scenario: An isolated surface parked by a workspace switch keeps its channel

- **WHEN** an isolated surface that asks to be kept is parked by a workspace switch and shown again
- **THEN** it was neither reloaded nor reconnected

#### Scenario: A distribution's default applies where nothing is declared

- **WHEN** a distribution sets the default and a surface declares nothing
- **THEN** the default applies
- **AND** a surface that declares its own is unaffected

### Requirement: What is kept is kept per pane

A kept surface SHALL be held against the pane showing it, not against which pane happens to carry
the address. A change of focus SHALL therefore never orphan what a pane was keeping, and a split
SHALL show two independent instances rather than one moving between them.

#### Scenario: A change of focus does not disturb what is kept

- **WHEN** the address moves between panes
- **THEN** each pane keeps what it was keeping

#### Scenario: A split shows two independent instances

- **WHEN** a kept surface is shown in two panes at once
- **THEN** each pane has its own instance

### Requirement: Moving a surface between panes does not restart it

Where the browser can move a rendered element without restarting it, the workbench SHALL move a kept
surface rather than rebuilding it. Where it cannot, the workbench SHALL rebuild, and the surface's
declared state SHALL still be restored.

#### Scenario: A kept surface survives being rearranged

- **WHEN** a pane holding a kept surface is split and re-joined
- **THEN** the surface is not restarted and its unsaved work is intact

#### Scenario: An isolated surface is hidden in place rather than moved

- **WHEN** an isolated surface is hidden
- **THEN** it is hidden without leaving its place, so that it is not reloaded

### Requirement: Closing asks before losing work

Closing something with unsaved work SHALL ask the user, offering to save, to discard, or to abort.
Saving SHALL be offered only where the surface can save; a save that fails, or that leaves the
surface still unsaved, SHALL abort the close and say so rather than closing anyway.

#### Scenario: Closing clean content does not ask

- **WHEN** nothing being closed has unsaved work
- **THEN** it closes immediately

#### Scenario: The user may save, discard or keep

- **WHEN** the user closes content with unsaved work
- **THEN** they are asked, and discarding closes it while aborting keeps it

#### Scenario: A save that does not succeed does not close

- **WHEN** saving fails, or completes with the surface still unsaved
- **THEN** the close is aborted and the user is told

#### Scenario: Saving is not offered where it is impossible

- **WHEN** content with unsaved work cannot save
- **THEN** only discarding and aborting are offered

### Requirement: The same question is asked wherever work would be destroyed

Every route that would destroy unsaved work SHALL ask: closing a tab or a pane, closing several at
once, turning a plugin off, resetting an arrangement, and leaving the application entirely.

#### Scenario: Turning a plugin off asks first

- **WHEN** a plugin with unsaved work in one of its surfaces is turned off
- **THEN** the user is asked, and aborting leaves the plugin on

#### Scenario: Resetting an arrangement asks first

- **WHEN** an arrangement holding unsaved work is reset
- **THEN** the user is asked

#### Scenario: Leaving the application asks

- **WHEN** unsaved work exists anywhere and the user leaves the application
- **THEN** the browser's own confirmation is raised

### Requirement: A surface may refuse its own close

A surface MAY refuse a close of its own accord, so that it can ask its own question first. A refusal
SHALL abort the close and SHALL NOT raise the workbench's own dialog; an approval SHALL NOT skip it,
because the two answer different questions.

A surface that fails to answer SHALL NOT be able to make something unclosable: after a bounded wait
the workbench SHALL offer to close anyway, and an answer that arrives while that offer stands SHALL
win over it. A refusal that errors SHALL count as consent.

#### Scenario: A refusal stops the close silently

- **WHEN** a surface refuses its close
- **THEN** the close is aborted and no workbench dialog appears

#### Scenario: Approving does not skip the unsaved-work question

- **WHEN** a surface approves its close while it has unsaved work
- **THEN** the unsaved-work question is still asked

#### Scenario: A surface that never answers cannot block forever

- **WHEN** a surface does not answer within the bounded wait
- **THEN** the user is offered a way to close anyway
- **AND** an answer arriving while that offer stands is honoured instead

#### Scenario: A broken refusal does not make content unclosable

- **WHEN** a surface's refusal throws
- **THEN** the close proceeds

### Requirement: An isolated surface has the same guarantees over its boundary

A surface running isolated from the workbench SHALL be able to report unsaved work and to refuse its
close across that boundary, and the workbench SHALL honour both exactly as for one running in the
page.

#### Scenario: An isolated surface reports unsaved work

- **WHEN** an isolated surface reports unsaved work and its tab is closed
- **THEN** the workbench asks before closing it

#### Scenario: An isolated surface refuses its own close

- **WHEN** an isolated surface refuses its close and asks its own question instead
- **THEN** the workbench does not close it and raises no dialog of its own

### Requirement: A surface that must survive being rebuilt has a place to put its state

Because the default is destruction, a surface that wants to look the same when it returns SHALL
store what it needs rather than relying on staying alive. The workbench SHALL provide that storage
per mounted instance.

#### Scenario: A rebuilt surface comes back as it was

- **WHEN** a surface storing its own state is hidden, destroyed and shown again
- **THEN** it is restored from what it stored
