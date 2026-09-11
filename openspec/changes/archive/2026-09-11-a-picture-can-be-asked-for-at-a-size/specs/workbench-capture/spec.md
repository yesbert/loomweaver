## ADDED Requirements

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
