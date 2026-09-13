## 1. Declaring widths on a panel region

- [x] 1.1 Make the layout region type a union by kind in which only the panel member carries optional
      start, narrowest and widest widths; add a type-level test that a width on a bar region does not
      compile and that every existing layout literal still does.
- [x] 1.2 Write failing tests for providing a layout: a panel whose narrowest exceeds its widest, or
      whose start lies outside its bounds once the workbench's values are filled in, is refused with
      the region named; a panel declaring some or none of the three is accepted.
- [x] 1.3 Validate panel regions when the layout is provided.

## 2. Per-panel bounds and the stored-width rule

- [x] 2.1 Write failing tests for the size service: a panel reads its declared start width until
      resized; undeclared values fall back to the workbench's; clamping uses the region's own bounds
      and leaves another region's alone; a released width equal to the start width is stored; a
      stored width above a panel's current widest is shown at the widest while the stored value is
      kept; the reset shows every declared start width at once.
- [x] 2.2 Resolve start, narrowest and widest per region from the declared layout, and make reading,
      setting and parsing use them, keeping every finite width.
- [x] 2.3 Write a failing test that the splitter's keyboard extremes and drag clamping use its own
      panel's bounds, then make the splitter read them per region.
- [x] 2.4 Confirm a width set through the distribution's sidebar service is clamped to that panel's
      bounds and remembered.
- [x] 2.5 Confirm a compact viewport still presents the panel at the overlay's width, whatever it
      declares.

## 3. Saying it where consumers read

- [x] 3.1 In the layout guide, describe declaring a panel's widths, what each one governs, and that a
      contradictory declaration is refused.
- [x] 3.2 Update the brief's layout region type and add the widths beside the layout declaration.
- [x] 3.3 Note in the changelog that the region type is narrowed by kind, with the narrowing a
      consumer building regions from a variable needs.
- [x] 3.4 Pack the shell and confirm the region type and its panel fields are in the packed type
      declarations.

## 4. Closing

- [x] 4.1 Run the unit suites and the repository guards.
- [x] 4.2 In the demo, declare a wider right panel and confirm in the running app that it opens at
      that width, drags within its bounds, keeps a released width across a reload and returns to the
      declared width on the app reset.
- [x] 4.3 Run `openspec validate --all --strict`.
