## 1. The request says how large

- [x] 1.1 Give the request for a picture a way to say how large: at the screen's density, at a
      plainer one, or within a greatest width.
- [x] 1.2 Resolve whatever was asked for into one size, from the workbench's own measurements, before
      anything is drawn. Bound it by what can be drawn rather than refusing.
- [x] 1.3 Reconcile the two bounds into one. The workbench stops at 3 and the frame at 4, and the
      frame's is what the published contract states, so 4 is what both keep. The floor of 1 goes,
      because a greatest width narrower than the workbench resolves below 1; a small positive floor
      takes its place. Correct the published JSDoc to whatever the reconciled bound is.
- [x] 1.4 Carry that one resolved size into both the host rendering and every surface request, so the
      two cannot diverge.
- [x] 1.5 Test: a plainer density yields fewer pixels; a named width is not exceeded and the
      proportions hold; asking for nothing draws as it does today; a request beyond the bound still
      answers.
- [x] 1.6 Test: a surface is asked at the same size the picture is drawn at, whatever was requested.

## 2. The request says in what form

- [x] 2.1 Accept the form the picture is carried in, and how strongly it is compressed where the form
      is compressed. Losslessly stays the default.
- [x] 2.2 Carry the form to each surface as well, so a piece is not encoded losslessly only to be
      recompressed in the finished picture.
- [x] 2.3 Read what actually came back rather than trusting what was asked for, because at least one
      browser substitutes silently.
- [x] 2.4 Test: a compressed picture holds fewer bytes than the lossless one; asking for nothing
      carries it losslessly; a form the browser refuses still produces a picture.

## 3. The answer describes itself

- [x] 3.1 The measurements already are the picture's own, so this needs a test that pins them rather
      than code that produces them. Add the test and say in the pull request that the requirement was
      already kept, so nobody reads a green test as new work.
- [x] 3.2 Report the form the picture is carried in, which is what was read back rather than what was
      asked for.
- [x] 3.3 Test: the measurements match a picture drawn within a named width; a substituted form is
      stated.

## 4. Saying it where consumers read

- [x] 4.1 The distribution reference page gained *Asking for a size and a form*: what may be asked
      for, what the answer says, and what a request the workbench cannot meet exactly does.
- [x] 4.2 *What compression costs here* gives the measured numbers rather than an estimate, and says
      which of the two levers to reach for first: a smaller picture loses detail evenly, a harder
      compression loses it exactly where the reader is looking.
- [x] 4.3 *Attaching it to a report* shows the whole case, from the request to the `FormData`, with
      the extension taken from what came back rather than from what was asked for.

## 5. Closing

- [x] 5.1 Exercised in the testbed across six requests. The pictures and their sizes are in the
      commit message and in the guide; the headless browser draws at a density of 1, so `'screen'`
      and `'plain'` coincide there and the density difference is not visible in that evidence.
- [x] 5.2 The unit suites, the whole end-to-end suite (345 green) and the repository guards all pass.
- [x] 5.3 `openspec validate --all --strict`: 29 passed, 0 failed.
- [x] 5.4 Every scenario in the delta is backed:
      - *A plainer picture is drawn plainer* — `draws fewer pixels when asked for a plainer picture`
      - *A named width is not exceeded* — `does not exceed a named width, and keeps the proportions`,
        and end-to-end `is drawn no wider than a width the caller names`
      - *Asking for nothing draws as before* — `draws at the density of the screen when nothing is
        asked for`
      - *An unreasonable request still answers* — `still answers a request beyond what it can draw`
      - *A compressed picture is smaller than a lossless one* — end-to-end `holds fewer bytes
        compressed than it does losslessly`, in a real browser because a stub cannot weigh bytes
      - *Asking for nothing carries it losslessly* — `carries the picture losslessly when nothing is
        asked for`
      - *A form the browser refuses is substituted, not failed* — `states the form it got when the
        browser substituted another`
      - *The measurements are the picture's own* — `does not exceed a named width, and keeps the
        proportions`
      - *A substituted form is stated* — `states the form it got when the browser substituted
        another`
      - drawn once rather than reduced — `asks a surface at the size the picture is drawn at` and
        `asks a surface for the same form the picture is carried in`
