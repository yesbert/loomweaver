## ADDED Requirements

### Requirement: A view whose frame plugin could not be loaded says so

Where a frame plugin fails to connect, a view at an address or with an id it registered while it
last answered SHALL say that the plugin could not be loaded, name it, and offer to try again, which
starts that plugin's frame anew. Saying a view does not exist SHALL be kept for an address no plugin
answered. A plugin that never answered is not named, because the workbench cannot know its addresses.

#### Scenario: A frame plugin that no longer loads is named

- **WHEN** a frame plugin that answered an address before fails to connect, and that address is shown
- **THEN** the view says the plugin could not be loaded, with the plugin's name and a way to try again
- **AND** it does not say the view does not exist

#### Scenario: Trying again shows the view

- **WHEN** the user tries again and the plugin connects
- **THEN** the plugin's view is shown at that address

#### Scenario: An address nobody answered still does not exist

- **WHEN** an address is shown that no plugin registered, while a frame plugin failed to connect
- **THEN** the view says it does not exist, and names no plugin
