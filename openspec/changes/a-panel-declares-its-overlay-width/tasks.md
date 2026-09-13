## 1. Declaring the overlay width

- [x] 1.1 Write failing tests for providing a layout: a panel declaring a positive overlay width is
      accepted; zero, a negative number, NaN or Infinity is refused with the region named.
- [x] 1.2 Add the optional overlay width to the panel region type with JSDoc, resolve it with the
      workbench's 288 pixels as the fallback, and validate it when the layout is provided.

## 2. Sizing the overlay

- [x] 2.1 Write a failing test that on a compact viewport the panel's box takes its declared overlay
      width capped as `min(<width>px, 100vw - 3rem)`, takes 288 pixels without a declaration, and
      ignores a width stored or set beside the content.
- [x] 2.2 Replace the fixed overlay width class with that style binding.
- [x] 2.3 Confirm the wide viewport is unchanged: the inline width, the splitter and the collapse
      behave exactly as before.

## 3. Proving it in a browser

- [x] 3.1 In the testbed, declare an overlay width on the right panel temporarily and confirm in the
      running app at a narrow width that the overlay takes it, that a wider declaration is capped with
      room to dismiss, and that the wide layout is unchanged; then remove the declaration.

## 4. Saying it where consumers read

- [x] 4.1 In the layout guide, describe the overlay width beside the other widths, its fallback, the
      screen cap and that it is not dragged.
- [x] 4.2 Add the field to the brief's `PanelRegion`.
- [x] 4.3 Pack the shell and confirm the field is in the packed type declarations and the
      documentation guard is green.

## 5. Closing

- [x] 5.1 Run the unit suites, the repository guards and the bundle size check.
- [x] 5.2 Run `openspec validate --all --strict`.
