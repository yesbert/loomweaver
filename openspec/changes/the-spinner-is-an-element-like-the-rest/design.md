## Context

Every other `<lw-*>` primitive is a custom element defined once at bootstrap and listed in one
place; the spinner predates that and stayed a framework component with the same tag. See proposal.md.

## Goals / Non-Goals

**Goals:** the spinner renders by tag for a host-rendered plugin, an isolated surface and a unit
test that registers it, with the same look as today.

**Non-Goals:** new variants, a determinate mode (that is the progress ring), a size scale.

## Decisions

**Replace the component rather than add an element beside it.** A custom element and a framework
component on one tag would both render into the same node inside the workbench. Keeping the
component under another selector would be a second spelling of the same thing with no user. The
project removes rather than deprecates, so the component goes and the release notes name it.

**Light DOM and a class contract, like the progress ring.** The element renders one
`<span class="lw-spinner-ring" role="status">` and sets its width and height from `size`. The ring's
border, colour and rotation move into the theme under `.lw-spinner-ring`, which already exists there
as the reduced-motion exception. The frame bundle compiles the same theme, so an isolated surface
gets it without further work.

**`label` is an attribute and a property; the caller translates.** The element has no access to the
translation service and the other elements do not translate either. Without a label the ring carries
`role="status"` and no name, as today.

## Risks / Trade-offs

- [A distribution imports `LwSpinner`] → its build fails with a missing export, which is loud; the
  release notes say to keep the tag and drop the import.
- [`size` given as a bare number] → the browser discards it and the default applies, as the progress
  ring documents; the guide repeats the note.
