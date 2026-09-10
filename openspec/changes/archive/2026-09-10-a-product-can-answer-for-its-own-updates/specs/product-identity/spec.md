## ADDED Requirements

### Requirement: A check reports what it found

A check for a new version SHALL report what it found to whoever asked for it, distinguishing at least
that a version is waiting, that this is the newest one, that the question could not be answered, that
an installation failed, and that the application has no offline machinery to check with. A caller
SHALL be able to draw its own answer from that rather than inferring it from silence.

#### Scenario: The caller learns the outcome

- **WHEN** a distribution asks the workbench to check for a new version
- **THEN** it is told which of those the check found

#### Scenario: An unanswerable check is distinguishable from a current one

- **WHEN** the check cannot be answered
- **THEN** what the caller is told differs from what it is told when the application is current

### Requirement: The last check is readable, including the ones nobody asked for

The workbench SHALL make the last check it performed readable as state: what it found, when it
happened, and whether the workbench made it by itself. A distribution SHALL be able to read that
without asking for a check of its own, so that an automatic check can be drawn in the product's own
interface rather than reaching the user only as the workbench's notice.

#### Scenario: A background check becomes readable

- **WHEN** the workbench checks by itself and finds nothing
- **THEN** a distribution can read that a check ran, when, and what it found

#### Scenario: A manual check is readable the same way

- **WHEN** a check is asked for
- **THEN** it is readable in the same place, marked as one that was asked for

### Requirement: A distribution may announce updates itself

A distribution SHALL be able to take over announcing updates. Where it does, the workbench SHALL show
no notice of its own about a waiting version, a current one, a check it could not answer, a failed
installation or broken offline storage, for a manual check and an automatic one alike.

Taking the announcing over SHALL take away nothing else: what the workbench knows stays readable,
applying an update stays available, and the marker a distribution chooses to keep stays driven by the
same state.

Where a distribution says nothing, the workbench SHALL announce exactly as it does today. The default
is the supported case rather than a fallback for the unconfigured one.

#### Scenario: The workbench stays quiet where the product answers

- **WHEN** a distribution announces updates itself and a new version becomes available
- **THEN** the workbench shows no notice of its own
- **AND** the product can still read that a version is waiting and apply it

#### Scenario: An automatic check is quiet too

- **WHEN** a distribution announces updates itself and the workbench's own check finds a new version
- **THEN** no notice is shown, and the product can read what was found

#### Scenario: Saying nothing keeps the workbench's own notices

- **WHEN** a distribution says nothing about announcing
- **THEN** the workbench announces as it always has
