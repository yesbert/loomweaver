## MODIFIED Requirements

### Requirement: Anything a plugin supplies for rendering is sanitised

Content a plugin supplies to be rendered as markup — a symbol, a piece of formatted text — SHALL be
sanitised before it reaches the document. Scripts, event handlers and script-bearing links SHALL be
removed, and something that does not survive sanitisation at all SHALL be dropped rather than
rendered empty. Formatted text SHALL also lose every style attribute and every form control, and
SHALL keep its ordinary formatting.

#### Scenario: A symbol carrying a script is cleaned

- **WHEN** a plugin contributes a symbol containing a script or an event handler
- **THEN** it is rendered without them

#### Scenario: Formatted text cannot introduce behaviour

- **WHEN** a plugin supplies formatted text containing markup that would execute
- **THEN** it is rendered without it

#### Scenario: Formatted text cannot draw over the workbench or ask for input

- **WHEN** a plugin supplies formatted text containing a style attribute, a form, an input field, a
  selection, a text area, a button, an option, a label or a field group, or an attribute naming a
  form or where it posts
- **THEN** it is rendered without them, in the workbench and in a sandboxed surface alike
- **AND** the words such an element held remain as text

#### Scenario: Ordinary formatted text is unchanged

- **WHEN** a plugin supplies formatted text with headings, lists, links, code and images
- **THEN** they are rendered as written, an image from another origin included

#### Scenario: Something that is entirely unsafe is dropped

- **WHEN** what a plugin contributed does not survive sanitisation
- **THEN** it is dropped rather than registered as empty
