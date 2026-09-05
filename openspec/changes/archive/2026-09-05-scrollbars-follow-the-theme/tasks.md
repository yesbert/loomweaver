## 1. The tokens

- [x] 1.1 Name a scroll thumb and a scroll track in the token set, with a value for the light theme
      and one for the dark, quiet enough to sit over content without competing with it.
- [x] 1.2 List both in the consumer documentation of the tokens, beside the surfaces they sit on.

## 2. The rule

- [x] 2.1 Draw every scrolling area of the workbench thin and from those tokens, in one inherited
      rule, using the standard properties only.
- [x] 2.2 Confirm no scrolling area of the workbench reserves width it did not reserve before, in
      the rail above all.

## 3. Pinning it

- [x] 3.1 A test that the workbench's scrolling areas resolve their indicator to the token rather
      than to the browser default, and that redefining the token changes what they resolve to.
- [x] 3.2 Look at the rail, a sidebar and a dialog while each scrolls, in both themes, and record
      what changed. Recorded as resolved values in the design note rather than as pictures: a
      browser that overlays its indicator paints nothing into a headless capture.
