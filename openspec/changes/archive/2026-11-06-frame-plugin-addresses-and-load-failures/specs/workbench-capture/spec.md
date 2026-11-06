## MODIFIED Requirements

### Requirement: A plugin may keep part of its surface out of the picture

A plugin SHALL be able to mark parts of its own surface so that their content is left out of a
picture and marked as withheld, as content that could not be obtained is. The marking SHALL apply to
any picture made after it is set. A plugin SHALL NOT be able to prevent a picture, nor withhold its
whole surface. It is sent no message about a picture; its own script may see its document change
while it is pictured, and learns nothing more from the workbench.

#### Scenario: A marked part is withheld

- **WHEN** a plugin has marked part of its surface and a picture is made
- **THEN** the content of that part does not appear in the picture, and the area is marked as
  withheld

#### Scenario: A plugin cannot refuse the picture

- **WHEN** a plugin attempts to prevent a picture from being made or to withhold its whole surface
- **THEN** the picture is made and its surface appears, minus whatever parts it marked

#### Scenario: The plugin is not told a picture is being made

- **WHEN** a picture is made
- **THEN** the plugin is sent no message about it, whether it runs in the page or in a frame

#### Scenario: An isolated surface may see its document change, and nothing more

- **WHEN** a picture is made of an isolated surface
- **THEN** no message reaches the plugin's frame, and its view is pictured as it is shown
- **AND** the plugin's own script may observe nodes added to and removed from its document while it
  is pictured, which is all it can learn of the picture
