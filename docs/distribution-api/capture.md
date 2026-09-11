# A picture of the workbench

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `workbench-capture` · `host-services` · `plugin-sandbox`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

Your product can ask the workbench to draw what the user is seeing, with no permission prompt, and
plugin surfaces on the picture rather than holes where they sit. It is meant for a fault report the
user writes without leaving the application.

## Do it

```ts
const capture = inject(WorkbenchCaptureService);

const picture = await capture.capture();
picture.image; // a data: URL — show it, let the user annotate it, attach it to a report
picture.width; // in device pixels
picture.height;
picture.surfacesAbsent; // how many areas say their content is absent rather than showing it
```

The picture is handed to you and to nobody else. Whether it is shown, altered or sent anywhere is
your product's business; the workbench neither stores it nor sends it.

## Why there is no prompt, and what it costs

The browser will not photograph a tab quietly. A permission prompt and a target picker are required
of it every time, by the specification rather than by any browser's choice, and no grant persists.
For a fault report that is fatal: a report that costs a system dialog before it starts is a report
nobody writes.

So the picture is **rendered from the document** instead. The consequence is worth stating plainly:
it is a faithful depiction, not a photograph. A surface that paints by means that cannot be
re-rendered may differ from what was on screen. If your product needs a true photograph for some
other purpose, the browser's own screen capture is still there; it is simply not what this is.

## What is on it, and what is not

**On it:** the workbench chrome, every surface rendered in the page, and every isolated surface that
answered the request to draw itself.

**Not on it:**

- **Content scrolled out of sight** inside a region. A workbench holds many independent scrolling
  regions and their full contents do not compose into any single image that was ever on screen. The
  picture is what the user could see, which is what a report needs it to be.
- **A surface the user opened in its own window.** That window is not this one.
- **Areas a plugin marked as withheld**, and areas whose content could not be obtained.

## When a surface is absent

An area whose content could not be obtained is drawn as a statement that it is absent, never left
blank. A blank rectangle in a picture attached to a fault report is read as evidence about the
fault; saying plainly that the content is missing misleads nobody.

`surfacesAbsent` counts them, so your report can say so in words as well. A surface is absent when it
failed, when it did not answer within four seconds, or when it does not expose the platform's own
methods. [Sandboxed surfaces](../weaver/sandboxed-surfaces.md) has the one line that fixes the last
of those.

## A plugin cannot ask for one

There is no path to a picture from a plugin's `ctx`, at any grant and at any isolation level. A
picture holds what every other surface on screen is showing, so a plugin that could obtain one would
be reading all of them.

A plugin may keep parts of its own surface off the picture, and may not refuse to be pictured at all.
The reasoning and the markup are on [Sandboxed surfaces](../weaver/sandboxed-surfaces.md).

## Where next

- [Sandboxed surfaces](../weaver/sandboxed-surfaces.md): what a plugin does to answer, and what it
  may withhold.
- [Windows, sync and updates](windows-and-sync.md): pop-out windows, which a picture never includes.
