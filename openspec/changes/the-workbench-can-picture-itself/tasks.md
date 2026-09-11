## 1. A surface can draw itself

- [ ] 1.1 Add a request to the methods the workbench calls on an isolated surface, asking it to
      render its own content and answer with the result as data. Keep the shape consistent with the
      requests already carried on that channel.
- [ ] 1.2 Implement the answering side in the assets served to a frame surface: render the surface's
      own document and return the result. Load the renderer on first use, not at surface start.
- [ ] 1.3 Rebuild the answer field by field on arrival, refusing anything unrecognised, so the
      existing rule that everything crossing the boundary is validated as data holds for this request
      too.
- [ ] 1.4 Bound the wait. A surface that does not answer in time is treated as one that could not be
      pictured, and the workbench carries on.
- [ ] 1.5 Test: an isolated surface answers with its content; a surface that never answers is
      reported as unpictured rather than hanging the caller.

## 2. The workbench assembles the picture

- [ ] 2.1 Render the hosting document, then place each surface's answer at the area that surface
      occupies, honouring scroll offset and device pixel ratio.
- [ ] 2.2 Draw an area whose content could not be obtained as one that states so, distinguishable
      from a surface that was showing nothing.
- [ ] 2.3 Leave the workbench as found: scroll positions, the address, selection and focus unchanged,
      and nothing visible on screen while the picture is made.
- [ ] 2.4 Offer the request on the surface a distribution already injects, documented alongside the
      others. Offer no path to it from a plugin's context.
- [ ] 2.5 Exclude a surface the user opened in its own window, and content scrolled out of sight
      within a region.
- [ ] 2.6 Test: a picture made with an isolated surface on screen contains that surface's content at
      its place; a plugin has no way to obtain a picture; the arrangement is unchanged afterwards.

## 3. What a plugin keeps out

- [ ] 3.1 Give a plugin a way to mark parts of its own surface as withheld, taking effect for any
      later picture without the plugin being told one is being made.
- [ ] 3.2 Render a withheld part the same way an unobtainable area is rendered, so the two read alike
      in a report.
- [ ] 3.3 Ensure a plugin can neither prevent a picture nor withhold its surface as a whole.
- [ ] 3.4 Test: a marked part is absent from the picture and its area is marked; an attempt to
      withhold the whole surface leaves the surface in the picture.

## 4. Saying it where consumers read

- [ ] 4.1 Add the request to the distribution API reference, in the index table and on the page it
      belongs to.
- [ ] 4.2 Say in the weaver guides what a plugin may mark and that it cannot refuse, and why.
- [ ] 4.3 State the limits next to the capability: a depiction rather than a photograph, the visible
      view only, and no other window.

## 5. Closing

- [ ] 5.1 Run `openspec validate --all --strict`.
- [ ] 5.2 Confirm every requirement in the delta is backed by a test, and name which test backs
      which requirement.
- [ ] 5.3 Exercise it once in the demo against a real isolated surface, and keep the picture as
      evidence.
