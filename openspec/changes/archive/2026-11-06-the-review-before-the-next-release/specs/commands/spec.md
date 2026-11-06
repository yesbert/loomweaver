## ADDED Requirements

### Requirement: A connection follows one run, and a check that fails lets nothing through

The connection that runs the workbench's commands for an agent SHALL follow one run at a time. When
a run starts, it SHALL forget every call an earlier run left open, so that such a call is neither
run nor answered later. Where a plugin checks a call before it runs and that check fails or gives no
decision, the call SHALL be refused and its command SHALL NOT run. The agent SHALL be told only that
the check failed; what went wrong is the developer's to read.

#### Scenario: A run that broke off leaves a call open

- **WHEN** a run ends without its last event while a call is open, and a second run then starts and
  finishes
- **THEN** the call of the first run is neither run nor answered in the second

#### Scenario: The check throws

- **WHEN** the check a plugin placed before a call throws
- **THEN** the call is answered as refused, its command does not run, the answer does not carry the
  error's message, and the run carries on with the next event

#### Scenario: The check answers with nothing it could decide

- **WHEN** the check answers with no decision, or with one the connection does not know
- **THEN** the call is refused and its command does not run
