## 1. The sidebar asks

- [x] 1.1 Resolve the inset for a docked view from the view's own declaration and the composition's
      default, through the resolver the content area already uses, and apply it instead of the
      hard-coded one.
- [x] 1.2 Unit tests: a docked view is flush where nothing asks for an inset; inset where the
      composition asks; flush where the view declares it owns its edges against a composition that
      asks; inset where the view asks against a composition that does not.

## 2. The views that lived off it

- [x] 2.1 Go through every view the testbed docks in a sidebar and decide, per view, whether it
      declares an inset or draws its own edges.
- [x] 2.2 The same for the demo.
- [x] 2.3 Look at both applications in a sidebar, in light and dark, and record what changed.

## 3. Holding it
- [x] 3.1 An end-to-end check that a view declaring it owns its edges is flush in a sidebar, which is
      the half of the guarantee no unit test can see.
