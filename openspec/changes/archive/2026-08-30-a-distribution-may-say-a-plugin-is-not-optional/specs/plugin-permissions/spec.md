## ADDED Requirements

### Requirement: A distribution may declare that a plugin is not optional

A distribution MAY declare that a plugin it composes is not optional. The permissions surface SHALL
list such a plugin, state what it holds, and SHALL NOT offer to switch it off. It SHALL remain
active, whatever the user chose before the declaration was made.

The declaration SHALL be the distribution's. A plugin SHALL NOT be able to make itself
not-optional by anything it says about itself, because everything a plugin declares in this model is
a request the distribution grants, and self-exemption from being switched off is the one grant that
would answer to nobody.

Withholding the switch SHALL withhold only that switch. The capabilities such a plugin was granted
SHALL remain revocable, because needing a plugin says nothing about needing everything it asked for.
This is narrower than the treatment of a plugin the operator deployed, which withholds both.

#### Scenario: The plugin an application cannot run without has no switch

- **WHEN** the user views the permissions of a plugin the distribution declared not optional
- **THEN** what it holds is stated, and no switch to turn it off is offered

#### Scenario: Its capabilities can still be withdrawn

- **WHEN** the user views the capabilities of such a plugin
- **THEN** each may still be withdrawn and restored

#### Scenario: A plugin that was switched off comes back when it becomes required

- **WHEN** a plugin the user had switched off is declared not optional
- **THEN** it is active again, and the surface offers no switch for it

#### Scenario: A plugin says nothing about being required

- **WHEN** a plugin declares itself not optional in what it says about itself
- **THEN** that has no effect, and only the distribution's declaration counts
