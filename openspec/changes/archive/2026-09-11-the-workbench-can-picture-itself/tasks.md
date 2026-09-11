## 1. A surface can draw itself

- [x] 1.1 Add a request to the methods the workbench calls on an isolated surface, asking it to
      render its own content and answer with the result as data. Keep the shape consistent with the
      requests already carried on that channel.
- [x] 1.2 Implement the answering side in the assets served to a frame surface: render the surface's
      own document and return the result. Load the renderer on first use, not at surface start.
- [x] 1.3 Rebuild the answer field by field on arrival, refusing anything unrecognised, so the
      existing rule that everything crossing the boundary is validated as data holds for this request
      too.
- [x] 1.4 Bound the wait. A surface that does not answer in time is treated as one that could not be
      pictured, and the workbench carries on.
- [x] 1.5 Test: an isolated surface answers with its content; a surface that never answers is
      reported as unpictured rather than hanging the caller.

## 2. The workbench assembles the picture

- [x] 2.1 Render the hosting document, then place each surface's answer at the area that surface
      occupies, honouring scroll offset and device pixel ratio.
- [x] 2.2 Draw an area whose content could not be obtained as one that states so, distinguishable
      from a surface that was showing nothing.
- [x] 2.3 Leave the workbench as found: scroll positions, the address, selection and focus unchanged,
      and nothing visible on screen while the picture is made.
- [x] 2.4 Offer the request on the surface a distribution already injects, documented alongside the
      others. Offer no path to it from a plugin's context.
- [x] 2.5 Exclude a surface the user opened in its own window, and content scrolled out of sight
      within a region.
- [x] 2.6 Test: a picture made with an isolated surface on screen contains that surface's content at
      its place; a plugin has no way to obtain a picture; the arrangement is unchanged afterwards.

## 3. What a plugin keeps out

- [x] 3.1 Give a plugin a way to mark parts of its own surface as withheld, taking effect for any
      later picture without the plugin being told one is being made.
- [x] 3.2 Render a withheld part the same way an unobtainable area is rendered, so the two read alike
      in a report.
- [x] 3.3 Ensure a plugin can neither prevent a picture nor withhold its surface as a whole.
- [x] 3.4 Test: a marked part is absent from the picture and its area is marked; an attempt to
      withhold the whole surface leaves the surface in the picture.

## 4. Saying it where consumers read

- [x] 4.1 Add the request to the distribution API reference, in the index table and on the page it
      belongs to.
- [x] 4.2 Say in the weaver guides what a plugin may mark and that it cannot refuse, and why.
- [x] 4.3 State the limits next to the capability: a depiction rather than a photograph, the visible
      view only, and no other window.

## 5. Closing

- [x] 5.1 Run `openspec validate --all --strict`.
- [x] 5.2 Every requirement in the delta is backed by a test:
  - *The workbench can picture itself without the browser's permission* — e2e `workbench-capture`:
    "asks the browser for no permission along the way".
  - *A plugin's surface appears in the picture* — e2e `workbench-capture`: "holds the isolated
    surface rather than a hole where it sits"; e2e `surface-capture`: "it answers with its own
    content, from an origin it does not have".
  - *A surface that cannot be pictured is said to be missing, not left blank* — unit
    `picture-assembly`: "says an absent surface is absent rather than leaving it blank"; unit
    `workbench-capture`: "counts the surfaces whose content is absent"; unit `surface-capture`:
    "gives up on a surface that never answers".
  - *Asking for a picture belongs to the distribution* — unit `host-plugin-context`: "is offered
    nowhere in a plugin context, at any grant".
  - *A plugin may keep part of its surface out of the picture* — e2e `surface-withholding`, all
    three: the marked area, the root that withholds nothing, and the surface that is never told.
  - *What is pictured is what is on the screen* — unit `workbench-capture`: "leaves out a surface
    scrolled past the edge of the window" and "leaves out a surface living in another window".
  - *Making a picture does not disturb the user's work* — e2e `workbench-capture`: "leaves the
    workbench as it found it" and "leaves nothing of its own behind in the document".
- [x] 5.3 Exercise it once in the demo against a real isolated surface, and keep the picture as
      evidence.
