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
picture.width; // the picture's own measurements, not the workbench's
picture.height;
picture.form; // 'lossless' | 'jpeg' | 'webp', read back from the drawing
picture.surfacesAbsent; // how many areas say their content is absent rather than showing it
```

The picture is handed to you and to nobody else. Whether it is shown, altered or sent anywhere is
your product's business; the workbench neither stores it nor sends it.

## Asking for a size and a form

A request that says nothing draws at the density of the screen and carries the picture losslessly,
which is what a person looking at it wants. A tracker with an attachment limit wants something else,
so say so:

```ts
const thumbnail = await capture.capture({ size: 'plain' });
const forCarrying = await capture.capture({
  size: { withinWidth: 1200 },
  form: { compressed: 'jpeg', quality: 0.7 },
});
```

`size` is `'screen'` (the default), `'plain'` for one picture pixel per CSS pixel, or
`{ withinWidth }` for a greatest width in picture pixels. A named width keeps the proportions of what
was pictured, and never enlarges: ask for 4000 on a workbench 1440 wide and you get 1440.

**The size is settled before anything is drawn**, and it reaches every isolated surface as the same
number. That is the point of asking rather than resizing afterwards: each part of the picture is
drawn once, at the size the finished picture needs, so none of it is a reduction of something else.
Two sizes means asking twice.

`form` is `'lossless'` (the default) or `{ compressed, quality }`, where `compressed` is `'jpeg'` or
`'webp'` and `quality` runs from 0 to 1, defaulting to 0.8.

### What compression costs here

On a picture of the testbed 1440 pixels wide, measured rather than estimated: 335 kB losslessly, and
131 kB as JPEG at 0.6. That is a real saving, and it is not free. Compression is unkind to small
text, and small text is most of what a fault report is read for: a stack trace, a field label, a
number in a table. Reach for it when something downstream has a limit, not by default.

Between the two, prefer a smaller picture to a more compressed one. Halving the width costs detail
everywhere and evenly; compressing hard costs it exactly where the reader is looking.

### When the workbench cannot do as asked

Neither a size nor a form is refused.

A size outside what can be drawn (below 0.05 or above 4 picture pixels per CSS pixel) becomes the
nearest size that can be. Someone is filing a fault report, and an error instead of a picture helps
nobody.

A form the browser will not produce is substituted, silently, by the browser itself: Safari answers a
request for WebP with a lossless picture and says nothing. **So read `picture.form` rather than
assuming what you asked for.** It is read back off the drawing, so it is what you actually have.

## Attaching it to a report

This is what the capability is for. Ask for a carried form, turn the address into bytes, hand it on:

```ts
const picture = await capture.capture({
  size: { withinWidth: 1600 },
  form: { compressed: 'jpeg', quality: 0.7 },
});

const blob = await (await fetch(picture.image)).blob();
const extension = picture.form === 'lossless' ? 'png' : picture.form;

const body = new FormData();
body.append('screenshot', new File([blob], `report.${extension}`, { type: blob.type }));
await fetch('/api/faults', { method: 'POST', body });
```

The extension comes from `picture.form` and not from the request, for the reason above. The workbench
offers no second way to get the bytes, because the conversion is the line you just read and holding
the same picture twice in memory would cost everyone to spare that line for some.

## What it costs a product that never asks

Nothing on the critical path. The renderer that does the drawing arrives in a chunk of its own, and
a product that never injects the service leaves the whole thing behind. Measured on the demo, which
takes no pictures: none of the capture code reaches its initial bundle.

One thing is worth knowing if you ship a service worker. The renderer is about 54 kB compressed and
sits in two places: a chunk beside your application, and a copy under `frame-kit/` that isolated
surfaces load for themselves. A blanket prefetch rule pulls both down on install, for a feature that
may never be called.

If you would rather fetch it when someone asks for a picture, give `frame-kit/snapdom.global.js` an
asset group of its own with `installMode: 'lazy'`. Put it ahead of the group matching the rest of
`frame-kit`, because the first matching group wins.

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
