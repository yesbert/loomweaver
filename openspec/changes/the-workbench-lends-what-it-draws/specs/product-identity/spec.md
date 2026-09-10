## ADDED Requirements

### Requirement: The product's identity can be presented where the product chooses

The block that presents the product's identity SHALL be available to a distribution to place
elsewhere in its own interface — an about dialog is the obvious place — and SHALL draw the same
name, mark and tagline, from the same supplied identity, as the workbench's own frame does.

A caller SHALL be able to ask for the narrow form, in which the mark stands for the product alone,
rather than having the form follow the width of the frame around it. Where a caller asks for
nothing, the form SHALL follow the frame, as it does in the workbench's chrome.

#### Scenario: The identity is drawn the same way outside the chrome

- **WHEN** a distribution places the identity block in its own interface
- **THEN** it shows the same name, mark and tagline as the workbench's frame does

#### Scenario: A caller can ask for the narrow form

- **WHEN** a caller asks for the narrow form
- **THEN** the mark stands for the product and the name is not drawn, whatever the frame's width

#### Scenario: Asking for nothing follows the frame

- **WHEN** a caller asks for no particular form
- **THEN** the block follows the width of the frame, as it does in the workbench's own chrome
