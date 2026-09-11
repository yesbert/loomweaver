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

- [ ] 2.1 Accept the form the picture is carried in, and how strongly it is compressed where the form
      is compressed. Losslessly stays the default.
- [ ] 2.2 Carry the form to each surface as well, so a piece is not encoded losslessly only to be
      recompressed in the finished picture.
- [ ] 2.3 Read what actually came back rather than trusting what was asked for, because at least one
      browser substitutes silently.
- [ ] 2.4 Test: a compressed picture holds fewer bytes than the lossless one; asking for nothing
      carries it losslessly; a form the browser refuses still produces a picture.

## 3. The answer describes itself

- [ ] 3.1 The measurements already are the picture's own, so this needs a test that pins them rather
      than code that produces them. Add the test and say in the pull request that the requirement was
      already kept, so nobody reads a green test as new work.
- [ ] 3.2 Report the form the picture is carried in, which is what was read back rather than what was
      asked for.
- [ ] 3.3 Test: the measurements match a picture drawn within a named width; a substituted form is
      stated.

## 4. Saying it where consumers read

- [ ] 4.1 Extend the distribution reference page with what may be asked for, what the answer says,
      and what a request the workbench cannot meet exactly does.
- [ ] 4.2 Say plainly what compression costs here: small text is what a fault report is read for.
      Give the guidance rather than presenting the cheaper form as free.
- [ ] 4.3 Show the attaching case, since it is why this exists: ask for a carried form, convert to
      bytes, hand it on.

## 5. Closing

- [ ] 5.1 Exercise it in the testbed at more than one size and form, and keep the pictures beside
      each other as evidence of what compression actually costs.
- [ ] 5.2 Run the unit suites, the end-to-end suite and the repository guards.
- [ ] 5.3 Run `openspec validate --all --strict`.
- [ ] 5.4 Confirm every requirement in the delta is backed by a test, and name which test backs which
      requirement.
