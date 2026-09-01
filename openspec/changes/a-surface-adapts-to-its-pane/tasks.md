## 1. The workbench supplies the reference

- [x] 1.1 Add `@container/surface` to the content pane's surface host in
      `regions/content/content-area.html`, the secondary pane host in
      `regions/content/content-secondary-pane.html`, and the panel host in
      `regions/panel/shell-panel.html`. Confirm these are the only three hosts that mount a surface
      before adding it, and add it to a fourth if one is found.
- [x] 1.2 Run `menu`, `tooltip`, `dialogs`, `palette-polish` and `pane-drag` in
      `loom-testbed-e2e`. These prove that nothing the workbench floats out of a surface is now
      positioned against the pane instead of the window. A failure here is fixed by moving that
      overlay to the root, not by dropping the containment.
- [x] 1.3 Add the narrow-pane scenarios from the `surfaces` delta to the testbed e2e suite: splitting
      re-lays out the surface, two panes of different widths lay out differently at the same time,
      and a surface moved to a sidebar follows the sidebar.
- [x] 1.4 Add a case proving a view that declares its own `@container` is unaffected, using one of
      the already-converted views rather than a fixture built for the test.

## 2. The testbed dashboard is laid out from its pane

- [x] 2.1 In `testbed-dashboard-view.html`, replace `sm:grid-cols-2` and `xl:grid-cols-4` on the KPI
      grid and `lg:grid-cols-2` on the two chart sections with container variants, choosing each
      breakpoint from the pane width at which that layout stops fitting rather than by renaming the
      viewport one.
- [x] 2.2 Let the cards shrink: `min-w-0` on the grid children, and on the inner elements that report
      a content width.
- [x] 2.3 Replace the fixed measures that only work at one width: the `h-24` chart boxes and the
      `flex justify-between` row of seven weekday labels, which is the first thing to collide.
- [x] 2.4 Check the `export` and `trends` sections at the same widths. They were not in the original
      report but carry `max-w-md` and a two-column grid, so they are the same shape of problem.

## 3. The demo insights dashboard is laid out from its pane

- [x] 3.1 In `demo/src/insights/dashboard-view.html`, replace `sm:grid-cols-2`, `lg:grid-cols-3` and
      `lg:col-span-2` with container variants.
- [x] 3.2 Give the chart cards `min-w-0` so the canvas stops holding its column open, and check that
      Chart.js re-lays out on the way down as well as on the way up.
- [x] 3.3 Replace the fixed `h-56` and `h-40` chart wrappers with a height that survives a narrow
      pane, and the `w-24` deadline column with one that gives way before the customer name does.
- [x] 3.4 Confirm the margin card, which only appears for the accounting role, is included at every
      width. The grid has a different number of children depending on the session.

## 4. The absence of overflow is pinned

- [x] 4.1 Add a narrow-pane test to `loom-testbed-e2e` that splits the content area, puts the
      dashboard in one half, and asserts its scroll width does not exceed its client width.
- [x] 4.2 Add the same for the demo's insights dashboard in `demo/e2e`.
      One limit, stated rather than hidden. The demo consumes a released `@loomweaver/shell`, so
      until it adopts a release carrying the pane reference its dashboard has no container to
      resolve against and stays single-column, where nothing overflows either. The overflow test
      therefore cannot tell the two apart on the pinned platform. Its companion, which asserts that
      the content area drives the layout, skips with that reason on the published shell and starts
      testing something the day the demo adopts the release. Both were run green against a locally
      packaged shell, and `demo/node_modules` was restored with `npm ci` afterwards.
- [x] 4.3 Verify both tests fail against the templates as they stand before the fixes are applied, so
      that a passing run means something. Record the observed failure in the change before moving on.
      Observed, twice in a row each. Testbed, primary pane narrowed to 150px in a 1600px window:
      `overview` reported `div 207>150`, `section 207>150` and four KPI cards at `83>32`; `trends`
      reported the two weekday rows at `147>58` and `195>58`. `export` did not overflow at any pane
      width, which is why 2.4 changed nothing there. Demo, content area 469px wide in a 1024px
      window: `article 145>128` and `article 130>128`, the money values at `text-2xl`.
      Two corrections the red run forced. The overflow probe counted inline elements, whose
      `clientWidth` is always 0, so it could never have gone green; it now skips them. And the first
      version of the narrowing helper pressed faster than the split ratio settled, landing three of
      eight presses and passing vacuously; it now waits for each press to take effect and asserts it
      reached the minimum ratio.

## 5. The tour can be recorded again

- [x] 5.1 Write `platform/tools/record-tour.mjs` driving the testbed with the Playwright library at
      1280 by 800, 25 fps, with the cursor and the captions drawn into the page by the script.
- [x] 5.2 Give it the four beats the current tour has: the command palette, a split, a sandboxed
      non-Angular plugin, and a plugin re-skinning the application. The split beat now shows a
      dashboard that adapts, which is the reason for re-recording.
- [x] 5.3 Record light and dark in one run and encode with `ffmpeg` to the exact file set
      `website/tools/sync-docs.mjs` requires: `tour-light` and `tour-dark` as `.webm`, `.mp4` and
      `.gif`, plus a `-poster.jpg` each.
- [x] 5.4 Make a missing `ffmpeg` an instruction rather than a stack trace, and keep the script out
      of CI.
- [x] 5.5 Note the command in `docs/reference/operations.md` rather than the maintainer-only
      releasing guide. Re-recording is not a release step: a contributor who changes the chrome the
      tour shows is the person who needs to know it can be reproduced.

## 6. The tour and the documentation are brought up to date

- [x] 6.1 Run the recording and replace the eight files under `assets/media/`. Check the result at
      full size in both themes before committing, since these are the first thing a visitor sees.
- [x] 6.2 Build the website and confirm the sync copies the new set and the landing page plays it.
- [x] 6.3 Add the pane as the thing to size against to `docs/reference/design-tokens.md`, in both
      forms: the Tailwind variant and the plain-CSS `@container surface (...)` for a product not on
      Tailwind.
- [x] 6.4 Run `openspec validate --all --strict`, the unit suites and lint for platform and demo.
