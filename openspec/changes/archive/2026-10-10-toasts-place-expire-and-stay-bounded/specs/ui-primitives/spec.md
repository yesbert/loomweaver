## MODIFIED Requirements

### Requirement: A plugin can raise a notice without owning where notices appear

A plugin SHALL be able to raise a transient notice with a kind, and the workbench SHALL place and
announce it. A notice raised by a plugin SHALL be identified in a way that cannot collide with the
workbench's own or with another plugin's.

A notice SHALL show its kind by a symbol and by colour, so that the kind is not carried by colour
alone. A raiser SHALL be able to name another symbol, named the way every other symbol in the
workbench is named and resolved through the same registry. The kind SHALL keep deciding the colour
and the urgency of the announcement whatever symbol is named, and the symbol SHALL be decoration:
what the notice says stays its wording.

#### Scenario: Two plugins raising notices do not collide

- **WHEN** two plugins raise notices using the same identity of their own
- **THEN** neither replaces the other's

#### Scenario: The kind is visible without telling colours apart

- **WHEN** notices of two different kinds are shown
- **THEN** they differ in symbol as well as in colour

#### Scenario: A named symbol replaces the kind's, and nothing else

- **WHEN** a raiser names a symbol for a notice
- **THEN** the notice shows that symbol
- **AND** its colour and the urgency it is announced with are still those of its kind

## ADDED Requirements

### Requirement: A notice leaves by itself unless it reports a failure

A notice whose raiser states no lifetime SHALL leave by itself after a time long enough to read it.
A notice of the error kind SHALL instead stay until the user dismisses it. A raiser SHALL be able
to state a lifetime, and to state that a notice stays whatever its kind.

Every notice SHALL be dismissable by the user, by pointer and by keyboard, whether or not it would
leave by itself.

The limit: what an isolated plugin may state is narrower, and is stated with the boundary it
crosses.

#### Scenario: A notice nobody gave a lifetime leaves

- **WHEN** a notice that is not an error is raised without a stated lifetime
- **THEN** it leaves by itself

#### Scenario: A failure stays

- **WHEN** a notice of the error kind is raised without a stated lifetime
- **THEN** it stays until the user dismisses it

#### Scenario: A raiser may keep a notice that is not a failure

- **WHEN** a raiser states that a notice stays
- **THEN** it stays until the user dismisses it, whatever its kind

### Requirement: A notice the user is attending to does not leave

Once the user moves the pointer on the notices, and for as long as it stays on them, or while
keyboard focus is in one, no notice SHALL leave by itself. When neither holds any longer, every
notice that would have left in the meantime SHALL stay a short remainder rather than leaving at
once, so that the notices do not move under the pointer and an action offered by a notice can be
reached without racing it.

The limit: a notice that appears under a pointer that is not moving is not attended to, and SHALL
leave as if the pointer were elsewhere. Otherwise a notice raised by the control the user just
activated, and drawn over that control, would stay for as long as the pointer rested there.

#### Scenario: Moving the pointer onto the notices holds them

- **WHEN** the user moves the pointer on a notice and leaves it there past the moment the notice
  would have left
- **THEN** it is still shown, and so is every other notice shown with it

#### Scenario: A notice appearing under a resting pointer still leaves

- **WHEN** a notice appears where the pointer already is, and the pointer does not move
- **THEN** the notice leaves when its lifetime runs out

#### Scenario: Keyboard focus holds them the same way

- **WHEN** keyboard focus is in a notice past the moment it would have left
- **THEN** it is still shown

#### Scenario: Leaving does not take the notice away at once

- **WHEN** the pointer leaves a notice whose lifetime ran out while it was held
- **THEN** the notice stays a short remainder before it leaves

### Requirement: The distribution chooses where notices appear

A distribution SHALL be able to choose where notices appear: at the top or the bottom edge of the
window, and there to the left, in the centre or to the right. Where it chooses nothing, notices
SHALL appear at the bottom right, as they did before there was a choice.

The newest notice SHALL sit nearest the chosen edge, with older ones further from it. On a narrow
viewport, the one at which the side panels become overlays, notices SHALL be centred at the chosen
edge whichever side was chosen, because a column at one side would cover most of the width anyway.

The choice is the distribution's and is made once for the application; a raiser SHALL NOT be able
to place its own notice.

#### Scenario: Notices appear where the distribution chose

- **WHEN** a distribution chooses the top edge and the centre, and a notice is raised
- **THEN** it appears at the top of the window, centred

#### Scenario: Saying nothing keeps the place

- **WHEN** a distribution chooses nothing
- **THEN** notices appear at the bottom right

#### Scenario: The newest is at the edge

- **WHEN** a second notice is raised while a first is shown
- **THEN** the second sits nearer the chosen edge than the first

#### Scenario: A narrow viewport keeps the edge

- **WHEN** a distribution chooses the top edge and the left side, and the viewport is narrow
- **THEN** notices are centred at the top edge

### Requirement: Only a bounded number of notices is shown at once

The workbench SHALL show no more than a small bounded number of notices at once. A notice raised
beyond that SHALL wait, and SHALL be shown, in the order raised, as a shown notice leaves or is
dismissed. The lifetime of a waiting notice SHALL NOT run until it is shown, so that no notice
leaves without having been shown.

#### Scenario: A notice beyond the bound waits

- **WHEN** more notices are raised than the workbench shows at once
- **THEN** the bounded number is shown and the others are not yet

#### Scenario: A waiting notice moves up

- **WHEN** a shown notice leaves or is dismissed while another waits
- **THEN** the one that waited longest is shown

#### Scenario: Waiting costs no lifetime

- **WHEN** a notice has waited longer than its lifetime before it is shown
- **THEN** it is shown for its whole lifetime

### Requirement: A repeated notice is counted, not stacked

Where a raiser raises a notice with the kind, the wording and the symbol of one it raised before,
and that earlier notice is still shown or waiting, the workbench SHALL NOT add a second. The
earlier notice SHALL show how often it was raised, and its lifetime SHALL start over.

A notice its raiser gave an identity SHALL keep replacing the notice of that identity, as before,
and SHALL NOT be counted: naming a notice says it is one thing being updated, not a thing
happening again. Notices of two different raisers SHALL never be counted together.

#### Scenario: The same notice twice is one card

- **WHEN** the same raiser raises the same notice twice while the first is still shown
- **THEN** one notice is shown, saying it was raised twice

#### Scenario: A repeat restarts the lifetime

- **WHEN** a notice is repeated shortly before it would have left
- **THEN** it stays for a whole lifetime from the repeat

#### Scenario: A named notice is replaced, not counted

- **WHEN** a raiser raises a notice under an identity it used before
- **THEN** the earlier notice is replaced and no count is shown

#### Scenario: Two raisers saying the same are two notices

- **WHEN** two plugins raise notices with the same kind and wording
- **THEN** each is shown as its own notice

### Requirement: A distribution may draw notices itself

A distribution SHALL be able to take over drawing notices. Where it does, the workbench SHALL draw
none, and the notices to be shown SHALL be readable as state: for each its kind, its wording, its
symbol where one was named, how often it was raised, and the action it offers. The distribution
SHALL be able to dismiss a notice, to run its action, and to tell the workbench that the user is
attending to the notices and when that ends.

Taking the drawing over SHALL take away nothing else. Which notices are to be shown, when one
leaves, how many are shown at once and how a repeat is counted are not the drawing's, and SHALL
hold exactly as they do where the workbench draws.

The limit: where a distribution draws notices itself, announcing them to assistive technology is
the distribution's.

Where a distribution says nothing, the workbench SHALL draw notices itself. The default is the
supported case rather than a fallback for the unconfigured one.

#### Scenario: The workbench draws nothing where the product draws

- **WHEN** a distribution draws notices itself and a notice is raised
- **THEN** the workbench shows no notice of its own
- **AND** the distribution can read the notice and what it offers

#### Scenario: A notice still leaves by itself

- **WHEN** a distribution draws notices itself and a notice's lifetime runs out
- **THEN** the notice is no longer among those to be shown

#### Scenario: The bound still holds

- **WHEN** a distribution draws notices itself and more notices are raised than are shown at once
- **THEN** the distribution reads only the bounded number as to be shown

#### Scenario: The product can hold the notices

- **WHEN** a distribution tells the workbench the user is attending to the notices
- **THEN** none leaves by itself until the distribution says that has ended, or the last notice is
  dismissed

#### Scenario: Saying nothing keeps the workbench's drawing

- **WHEN** a distribution says nothing about drawing notices
- **THEN** the workbench draws them
