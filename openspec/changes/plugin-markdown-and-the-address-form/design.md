## Context

Formatted text is rendered by one host element, in the workbench and in a sandboxed surface alike
(the frame kit registers the same element). The plugin store's details and the workbench's dialogs
render through it too. So one sanitiser profile covers every place.

## Decisions

- **Forbid by name on top of the default profile.** The default profile already removes what
  executes; the change adds the presentation and form markup that can impersonate the workbench.
  Forbidding named tags and attributes keeps everything else the default allows, so ordinary
  Markdown does not change. An allow-list was rejected: it would have to restate every element
  Markdown produces and would drift with the parser.
- **Content of a removed form element stays as text.** A label's or button's words remain, without
  the control; dropping the text too would hide what the plugin wrote without making anything safer.
- **Remote images stay.** The owner did not ask to change them; an image that tracks a reader is a
  separate question.
- **Task-list checkboxes go.** The Markdown parser draws a task list item as a disabled checkbox. It
  is an input, so it is removed with the rest; the item's text remains. Allowing a disabled checkbox
  as an exception was rejected as the first crack in a rule that is simple because it has none.
- **The address form is specified as built.** The published descriptions and the guide already say
  which fields are decoded and which carry the encoded form; the requirement states the same and the
  existing tests are its evidence.

## Consequences

A plugin that styled its formatted text inline loses that styling, and one that drew a form inside it
must draw the form in its own markup instead.
