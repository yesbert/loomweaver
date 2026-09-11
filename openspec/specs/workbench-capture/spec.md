# workbench-capture Specification

## Purpose

A product that lets its user report a fault needs a picture of the screen the fault happened on, and
the browser will not give one up without asking the user's permission first. This capability states
what the workbench guarantees about a picture it makes of itself: that no permission is asked, that
plugin surfaces appear in it rather than as holes, who may ask for one, and what a plugin may keep
out of it.

## Requirements

### Requirement: The workbench can picture itself without the browser's permission

The workbench SHALL be able to produce a picture of what it is currently showing without invoking
any browser facility that asks the user for permission or presents a choice of what to capture. The
picture SHALL be handed only to the caller that asked for it.

The picture is assembled from what the workbench is rendering, not photographed from the screen. It
SHALL therefore be understood as a faithful depiction rather than an exact one, and where a surface
draws by means the workbench cannot re-render, that part of the picture MAY differ from the screen.

#### Scenario: No permission is asked

- **WHEN** a distribution asks the workbench for a picture of itself
- **THEN** the picture is produced and the user is asked for nothing

#### Scenario: The picture goes nowhere on its own

- **WHEN** the workbench has produced a picture
- **THEN** it is returned to the caller, and the workbench sends it nowhere and stores it nowhere

### Requirement: A plugin's surface appears in the picture

A surface contributed by a plugin SHALL appear in the picture with its content, including a surface
running isolated, whose content nothing outside it may read. The workbench SHALL obtain that content
by asking the surface to render itself and being answered, the same way it makes every other request
of a surface across that boundary, and what comes back SHALL be treated as data like anything else
that crosses.

#### Scenario: An isolated surface is in the picture

- **WHEN** a picture is made while a surface composed at the isolated level is on screen
- **THEN** that surface's content appears in the picture at the place the surface occupies

#### Scenario: A surface rendered in the page is in the picture

- **WHEN** a picture is made while a surface running in the application's own context is on screen
- **THEN** that surface's content appears in the picture at the place the surface occupies

### Requirement: A surface that cannot be pictured is said to be missing, not left blank

Where a surface does not answer the request to render itself, answers too slowly, or fails, the
workbench SHALL still produce a picture, and SHALL mark the area that surface occupies as one whose
content is not in the picture. It SHALL NOT leave that area blank or fill it with anything that
could be mistaken for what the surface was showing.

A blank area in a picture attached to a fault report is read as evidence about the fault. Saying
plainly that the content is absent misleads nobody; leaving it empty misleads everybody.

#### Scenario: An unanswering surface does not stop the picture

- **WHEN** a surface does not answer the request to render itself
- **THEN** a picture is still produced, and the area that surface occupies states that its content is
  not included

#### Scenario: The absence is distinguishable from emptiness

- **WHEN** a picture contains an area whose content could not be obtained
- **THEN** that area is distinguishable from a surface that was genuinely showing nothing

### Requirement: Asking for a picture belongs to the distribution

The ability to ask for a picture SHALL be part of what a distribution may rely on and SHALL be
documented there. A plugin SHALL NOT be able to ask for one, whatever it was granted and whatever
level it runs at, because a picture holds what every other surface on screen is showing and a plugin
that could obtain one would be reading all of them.

#### Scenario: A distribution asks and is answered

- **WHEN** a distribution's own code asks the workbench for a picture
- **THEN** it receives one

#### Scenario: A plugin has no way to ask

- **WHEN** a plugin looks for a way to obtain a picture of the workbench
- **THEN** none is offered to it, and no capability grants one

### Requirement: A plugin may keep part of its surface out of the picture

A plugin SHALL be able to mark parts of its own surface so that their content does not appear in a
picture, and those parts SHALL be marked as withheld in the same way as content that could not be
obtained. The marking SHALL take effect for a picture made at any time after it is set, without the
plugin being told that a picture is being made.

A plugin SHALL NOT be able to prevent a picture from being made, nor to withhold its surface as a
whole. What is on the screen is already in front of the user, who may record it by other means; a
refusal would withhold nothing from them while denying the product the one thing the picture is for.

#### Scenario: A marked part is withheld

- **WHEN** a plugin has marked part of its surface and a picture is made
- **THEN** the content of that part does not appear in the picture, and the area is marked as
  withheld

#### Scenario: A plugin cannot refuse the picture

- **WHEN** a plugin attempts to prevent a picture from being made or to withhold its whole surface
- **THEN** the picture is made and its surface appears, minus whatever parts it marked

#### Scenario: The plugin is not told a picture is being made

- **WHEN** a picture is made
- **THEN** the plugin is given no moment at which it could act differently because it is being
  pictured

### Requirement: What is pictured is what is on the screen

The picture SHALL depict the workbench as the user saw it at the moment it was asked for: what was
scrolled out of sight within a region stays out of the picture, and a surface the user opened in its
own window is not in it.

This limit is the guarantee, not a shortfall against one. A picture attached to a fault report is
read as evidence of what the user was looking at, and content they could not see would make it
evidence of something else.

#### Scenario: Content scrolled out of sight stays out

- **WHEN** a region holds more content than it shows and a picture is made
- **THEN** the picture shows what the region was showing, and not what lay beyond it

#### Scenario: Another window is not in the picture

- **WHEN** the user has opened a surface in its own window and a picture is made
- **THEN** that window is not part of the picture

### Requirement: Making a picture does not disturb the user's work

Making a picture SHALL leave the workbench as it found it. What the user had scrolled to, what held
the address, what was selected and what was being typed SHALL be unchanged afterwards, and the making
of the picture SHALL NOT be visible as movement, flicker or reflow on the screen.

#### Scenario: The arrangement survives the picture

- **WHEN** a picture is made while a region is scrolled and a surface holds the address
- **THEN** afterwards the region is scrolled as before and the same surface holds the address

#### Scenario: Nothing is seen to happen

- **WHEN** a picture is made
- **THEN** the user sees no movement or change on screen caused by making it

### Requirement: A caller may say how large the picture should be

The request for a picture SHALL accept how large it is to be drawn: at the density of the screen it
is drawn on, at a plainer one, or within a greatest width the caller names. Where nothing is asked
for, the workbench SHALL draw at the screen's own density, which is what it does today.

A picture SHALL be drawn once at the size asked for, rather than drawn at one size and reduced
afterwards, so that what a surface contributes is as sharp as the picture around it.

The workbench SHALL bound what can be asked for. A request outside that bound SHALL produce the
nearest picture the workbench can draw rather than a refusal, because a caller asking for something
unreasonable wants a picture more than it wants an error.

#### Scenario: A plainer picture is drawn plainer

- **WHEN** a caller asks for a picture at a plainer density than the screen's
- **THEN** the picture has fewer pixels along each edge than one drawn at the screen's density

#### Scenario: A named width is not exceeded

- **WHEN** a caller names a greatest width and the workbench is wider than it
- **THEN** the picture is no wider than the width named, and its proportions are those of what was
  pictured

#### Scenario: Asking for nothing draws as before

- **WHEN** a caller asks for a picture without saying how large
- **THEN** it is drawn at the density of the screen

#### Scenario: An unreasonable request still answers

- **WHEN** a caller asks for a picture larger or smaller than the workbench can draw
- **THEN** the nearest picture it can draw is produced, and no error is raised

### Requirement: A caller may say in what form the picture is carried

The request SHALL accept the form the picture is carried in: losslessly, which SHALL remain what is
drawn when nothing is asked for, or compressed for carrying. Where a form is compressed, the caller
SHALL be able to say how strongly.

Where the browser cannot produce the form asked for, the workbench SHALL produce the picture in a
form it can rather than failing, because a picture in the wrong form still shows the fault and no
picture shows nothing.

#### Scenario: A compressed picture is smaller than a lossless one

- **WHEN** a caller asks for the same picture compressed
- **THEN** what it receives holds fewer bytes than the lossless form of that picture

#### Scenario: Asking for nothing carries it losslessly

- **WHEN** a caller asks for a picture without saying in what form
- **THEN** it is carried losslessly

#### Scenario: A form the browser refuses is substituted, not failed

- **WHEN** a caller asks for a form this browser cannot produce
- **THEN** a picture is still produced, in a form the browser can

### Requirement: The answer describes the picture, not the screen

What the workbench answers with SHALL describe the picture it carries: its measurements SHALL be
those of the picture as drawn, and it SHALL state the form the picture is carried in. A caller that
asked for something other than the default SHALL NOT have to measure or inspect the picture to learn
what it received.

Where the workbench could not meet the request exactly, what it answers SHALL describe what it
actually did, so that the difference is discoverable rather than silent.

#### Scenario: The measurements are the picture's own

- **WHEN** a caller asks for a picture within a named width and reads the measurements it answered
  with
- **THEN** they are the measurements of the picture received, not of the workbench that was pictured

#### Scenario: A substituted form is stated

- **WHEN** the workbench produced a form other than the one asked for
- **THEN** the answer states the form it produced
