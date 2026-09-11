## Context

See `proposal.md` — Why. What stands before this change, and what it has to fit into:

- A picture is drawn in two places at once. The workbench renders the hosting document, and each
  isolated surface is asked to render itself; the answers are placed where the surfaces sit. Both
  already take a size, and it is the same number, resolved once from the screen's density.
- The size is fixed at the moment of drawing and cannot be changed afterwards without redrawing.
  That is why this is a property of the request rather than of what comes back.
- Encoding happens twice as well: a surface encodes what it drew to hand it across the boundary, and
  the workbench encodes the assembled picture for the caller.
- Measured on the testbed: 1440 × 860 at the screen's density comes to 0.33 MB carried losslessly,
  drawn in roughly 430 ms.

## Goals / Non-Goals

**Goals:**

- One request, carrying everything that has to be known before anything is drawn.
- A surface draws once, at the size the finished picture needs, not at one size to be reduced later.
- A caller can tell from the answer what it actually got, without measuring it.

**Non-Goals:**

- No second way to obtain the same picture, and no second representation of it beside the first.
- No redrawing of a picture already taken. A caller wanting two sizes asks twice.
- Nothing about where the picture goes afterwards.

## Decisions

**Resolve the request to a single number before anything is drawn.**
A greatest width is a property of the finished picture, but the surfaces are drawn before the picture
is assembled. So the width is turned into the same scale the drawing already uses, once, from the
workbench's own measurements, and that scale is what both the host rendering and every surface
request carry. Resolving it later would mean assembling at one size and reducing afterwards, which
costs the sharpness of exactly the part of the picture a fault report is usually about.

**Bound the request rather than refuse it.**
The drawing surface has a largest edge it can hold, and the existing code already caps the density.
A request beyond either is brought within it. The alternative, refusing, trades a picture for an
error at the moment someone is trying to report a fault, and the caller learns what happened anyway
because the answer describes itself.

**Detect the substituted form rather than trust the request.**
At least one browser answers a request for a compressed form by quietly producing a lossless one.
That is documented behaviour of the renderer in use, not a bug to work around. What comes back
therefore has to be read to learn what it is, rather than assumed from what was asked, and the answer
states what was read. Assuming would make the answer lie in exactly the case the caller most needs it
to be true.

**The form crosses the boundary too.**
A surface currently encodes losslessly whatever the picture will be. Where the finished picture is
compressed, encoding the pieces losslessly first is wasted work on both sides of the boundary, so the
request carried to a surface gains the form alongside the size it already carries.

**No bytes beside the address.**
A caller that needs bytes rather than an address converts what it was given in one line. Offering
both would put two doors on one thing and hold the same picture twice in memory for everyone, to
spare that line for some. Where this turns out to be the wrong call, it is a change of its own with
evidence behind it.

## Risks / Trade-offs

- **Compression is unkind to small text, which is what a fault report is read for.** A picture that
  is cheap to carry and unreadable is worse than one that is neither. → The lossless form stays the
  default, so the cost is only paid by a caller that chose it; the guidance says plainly what
  compression costs here, rather than presenting it as free.
- **A caller can ask for a picture too small to be evidence.** → That is the caller's judgement to
  make, the same as choosing what to attach. The workbench states what it drew and does not second-
  guess it.
- **Two places resolve a size, and they must agree.** The host rendering and each surface request
  take the same number; if they ever diverge, surfaces land at the wrong scale in the assembled
  picture. → The number is resolved once and passed, never computed twice, and a test pins that a
  surface is asked at the same scale the picture is drawn at.

## Open Questions

- Whether a greatest **height** is worth accepting beside a greatest width. A workbench is wider than
  it is tall far more often than the reverse, so width alone may be the whole need. Adding it later
  changes nothing decided here.
