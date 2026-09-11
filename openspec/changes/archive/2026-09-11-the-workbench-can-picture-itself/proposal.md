> **Status:** approved.

## Why

A product built on the workbench wants its user to be able to report a fault without leaving the
application, and a report of a fault is worth little without a picture of the screen it happened on.
Nothing the platform offers can produce one.

The browser can, and refuses to do it quietly: capturing rendered pixels always costs a permission
prompt and a surface picker, every time, by design of the specification rather than by any
browser's choice. Reconstructing the picture from the document costs no prompt at all, but it stops
at a plugin's frame, because an isolated surface is stripped of its origin and nothing outside it
may read what it drew. The interesting part of the screen, the part a report is usually about,
comes out blank.

That gap can only be closed where the boundary is owned. A product cannot reach across it and a
plugin must not; the workbench already speaks to every isolated surface, and is the one party that
can ask a surface to draw itself and be answered.

## What Changes

- The workbench can produce a picture of what it is currently showing, without asking the browser
  for permission, and plugin surfaces appear in that picture rather than as blanks.
- An isolated surface can render its own content and return the result across the boundary as data,
  answering a request from the workbench the way it already answers the other requests the workbench
  makes of it.
- A distribution can ask for that picture through the published surface it already uses to drive the
  workbench. A plugin cannot ask for it, because a plugin that could would be reading every other
  plugin's screen.
- A plugin can mark parts of its surface to be left out of a picture, so that what must not be
  carried into a report is not carried into one. A plugin cannot refuse to be pictured: the user is
  already looking at those pixels and can photograph them, so a refusal would protect nobody while
  making the feature useless for the case it exists for.
- The picture is offered to the application that asked for it and to nobody else. Whether it is
  shown, altered or sent anywhere is the product's own business, and this change carries none of it.

## Capabilities

### New Capabilities

- `workbench-capture`: what the workbench guarantees about a picture of itself — that it can make
  one without the browser's permission, that plugin surfaces appear in it, who may ask for one, and
  what a plugin may keep out of it.

### Modified Capabilities

None. The boundary rules this relies on are already stated and do not change: everything crossing is
rebuilt as data, a function never crosses, and where the workbench needs something from a plugin it
calls a method the plugin exposes. A picture returned in answer to such a call is another instance of
the existing rule, not an exception to it. Likewise, a new service offered to a distribution is
already covered by the requirement that what a distribution may rely on is published and documented.

## Impact

- The published contract gains a way for a distribution to ask for a picture, and the assets served
  to an isolated surface gain the ability to answer such a request.
- The channel between the workbench and an isolated surface carries one more kind of request.
- A rendering dependency is introduced on both sides of that channel; it is loaded when a picture is
  first asked for, not when a surface starts, so a product that never captures pays nothing for it.
- No legacy source is dissolved by this change: no decision record, no document and no file is
  superseded. The behaviour is new.

## Non-Goals

- **Content scrolled out of sight.** A workbench is not a page with one scrollbar; it holds many
  independent scrolling regions, and their full contents do not compose into any single image that
  was ever on screen. What a picture of an expanded region should mean is a separate question and
  gets its own answer.
- **Windows other than the one being pictured.** A surface the user opened in its own window is not
  part of the picture.
- **Delivering the report.** Where a report goes, by mail or into a tracker, is the product's own
  backend seam and is reached the way every other backend is reached.
- **Marking up the picture.** Drawing on it, obscuring parts of it and writing the report around it
  are the product's own interface.
