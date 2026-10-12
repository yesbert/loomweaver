## ADDED Requirements

### Requirement: A choice that is unavailable but must stay reachable looks unavailable

The workbench's style classes for a switch, a radio and a checkbox SHALL draw a control that is marked
as unavailable while staying reachable exactly as they draw a control that is natively disabled. The
control SHALL stay in the tab order and keep its visible focus, so that a reason tied to it is reached
and announced with it.

The limit: the class changes the look only. A control marked this way still changes when it is
activated, and whoever owns it SHALL refuse the change itself. A control that is natively disabled
keeps behaving as the browser makes it behave, and is still the right choice where there is no reason
to give.

#### Scenario: Marked unavailable looks like disabled

- **WHEN** a plugin marks a switch, a radio or a checkbox that carries the workbench's class as
  unavailable without disabling it natively
- **THEN** it is drawn as the same control natively disabled would be

#### Scenario: Marked unavailable stays reachable

- **WHEN** a person moves through the controls with the keyboard
- **THEN** a control marked unavailable receives focus and shows it, and its described reason is
  announced with it
