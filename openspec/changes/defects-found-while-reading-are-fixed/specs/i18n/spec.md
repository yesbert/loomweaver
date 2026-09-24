## MODIFIED Requirements

### Requirement: The starting language is resolved before the first paint

The workbench SHALL determine its starting language before it renders anything, from the languages
the distribution serves: a previously chosen language if it is still served, otherwise the first of
the user's browser preferences that matches a served language, otherwise English if it is served,
otherwise the first language the distribution declared.

A browser preference SHALL match a served language when it names that language exactly, or when it
names a regional form of it and the region-less language is served.

Because this answer is needed before the application's services exist, it is read from
device-local storage rather than through the product's settings port. A product whose settings live
behind a network therefore MUST accept that the first paint uses the device-local answer and that
its stored preference is applied once it arrives.

#### Scenario: A previous choice is honoured

- **WHEN** a language the workbench serves was chosen on this device before
- **THEN** the workbench starts in that language

#### Scenario: An unusable stored value does not strand the user

- **WHEN** the stored value names a language the workbench does not serve, including one a previous
  declaration served and the current one leaves out
- **THEN** it is ignored and the browser preference decides

#### Scenario: A regional browser preference selects its language

- **WHEN** the browser prefers a regional form of a language and the distribution serves that
  language without a region
- **THEN** the workbench starts in the served language

#### Scenario: English is the last resort

- **WHEN** neither a stored value nor any browser preference names a language the workbench serves
- **AND** English is served
- **THEN** the workbench starts in English

#### Scenario: Without English, the first declared language is the last resort

- **WHEN** neither a stored value nor any browser preference names a language the workbench serves
- **AND** the distribution's declaration does not include English
- **THEN** the workbench starts in the first language the distribution declared

#### Scenario: A network-stored preference arrives after the first paint

- **WHEN** the product's settings port later reports a different language
- **THEN** the workbench switches to it
- **AND** it does not write that value back, because nothing about it changed

#### Scenario: A preference the product's store answers at once is applied

- **WHEN** the product's settings port answers at once with a served language that differs from the
  device-local answer the workbench started with
- **THEN** the workbench switches to the port's language as it starts, without a gesture from the user
- **AND** it does not write that value back

#### Scenario: A stored preference is applied without a language switcher

- **WHEN** a distribution offers no control to change the language and the product's settings port
  holds a served language
- **THEN** the workbench uses that language once the port has answered
