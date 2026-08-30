## Context

See proposal.md — Why. Two places draw a small round mark today: a rail entry, which draws one or two
letters where `initials` is given and its icon otherwise, and the heading of a menu opened from a
control, which does the same in its own leading slot. Both are drawn by the host, so both have to
learn the same three-step fallback.

The rail is an Angular template; the menu heading is built element by element in the menu service,
because a menu lives outside the component tree. The fallback therefore has to be expressed twice,
and the design's job is to make the two agree.

## Goals / Non-Goals

**Goals:**

- One optional field, the same in both places, with the fallback owned by the workbench.
- A picture that fails is indistinguishable from a picture that was never given: the entry looks
  exactly as it does today.

**Non-Goals:**

- A bar button. It has neither a short mark nor a picture today, and nobody has asked; adding one
  would mean inventing the mark first.
- Fetching, caching, resizing or cropping a picture beyond what the browser does with an image. The
  platform ships no server and holds no store of its own.
- A picture on a workspace entry the workbench itself offers. Its mark is derived from the name on
  purpose, and a picture would have to come from somewhere the workbench does not have.

## Decisions

### `image` is a URL the product supplies, and nothing more

`RailItem.image` and `MenuHeader.image` take what an image element takes. A data URL works, so does an
address the product serves. The workbench does not fetch it itself, which keeps the platform's
frontend-only rule: whether a picture can be reached at all, and from which origin, is the product's
own arrangement, and the guide says so rather than the platform trying to help.

### The fallback runs on the load failure, not on a probe

The rail keeps the ids whose picture failed in a signal and drops the picture for those, so the mark
or the icon takes over on the same paint. The menu heading, built imperatively, swaps its own
contents in the image's error handler. Both end at the same three-step ladder: picture, mark, icon.

A pre-flight probe was rejected: it doubles the requests, it is wrong the moment a URL expires between
probe and paint, and the browser already reports exactly the event we need.

### The picture is decoration in the accessibility tree

The rail entry is a button already labelled by its title, and the menu is labelled by its heading, so
the image carries an empty alternative text and is hidden from assistive technology. Anything else
reads the person's name twice, which is what the heading change avoided a moment ago.

### The shape is square and the crop is the browser's

Both slots are round, and a picture that is not square is covered rather than squashed, so a portrait
photograph is cropped to its middle instead of being distorted. No token and no option: a product that
wants another shape reaches the class, the way it reaches every other measurement.

## Risks / Trade-offs

- **A picture from another origin is blocked by the product's own policy** → it fails to load, which
  is a case the fallback already covers; the guide names the policy so the developer knows where to
  look.
- **A picture that loads slowly** → the entry shows its mark until it arrives, which is the same as
  the entry today rather than a hole in the rail.
- **The two implementations can drift**, since one is a template and one is built by hand → both are
  pinned by tests that assert the same ladder.
