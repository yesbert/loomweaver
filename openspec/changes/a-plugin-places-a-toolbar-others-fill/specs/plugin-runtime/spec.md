## MODIFIED Requirements

### Requirement: A contribution aimed at a place that cannot render it is reported

Where a plugin contributes something to a region that the distribution's layout does not declare,
or to a region of the wrong kind, the contribution SHALL be reported to the developer rather than
silently doing nothing.

Where a plugin contributes a menu entry to a slot that nothing declares — no menu the workbench
draws, no contributed control that names the slot, no toolbar a plugin registered — the entry SHALL
likewise be reported. Because the plugin that fills a slot may activate before the plugin that
declares it, this report SHALL be made once every composed plugin has activated, and SHALL NOT be
made at the moment of registration. An entry whose slot is declared by then SHALL NOT be reported.

#### Scenario: An item names a region that does not exist

- **WHEN** a plugin contributes an item to a region the layout does not declare
- **THEN** the developer is told, naming the item and the region

#### Scenario: An item names a region of the wrong kind

- **WHEN** a plugin contributes an item to a region that exists but cannot host that kind of item
- **THEN** the developer is told

#### Scenario: A contribution that can render is not reported

- **WHEN** a plugin contributes an item to a region that exists and can host it
- **THEN** nothing is reported

#### Scenario: A menu entry names a slot nothing declares

- **WHEN** every composed plugin has activated and an entry names a slot that no workbench menu, no
  control and no toolbar declares
- **THEN** the developer is told, naming the entry, the slot and the plugin that contributed it

#### Scenario: A slot declared by a later plugin is not reported

- **WHEN** a plugin contributes an entry to a slot and a plugin that activates afterwards declares it
- **THEN** nothing is reported
