## 0. Inventory

- [x] 0.1 List, line by line, every place that raises, holds, draws or carries a notice today: the service, the outlet and its template, the feedback colours, the plugin context's notice call, the channel's sanitiser and method, the update notices, the refused-capability notices, the two unsaved-work notices, the translation keys, and every helper they already use for identities, timers and wire fields; reuse what is there and add no parallel path
- [x] 0.2 List every notice raised without a stated lifetime in the first-party weavers, the testbed, the demo, the examples and the scaffolding recipes, with the kind of each, and record for each whether it should now leave or must state that it stays
- [x] 0.3 Ask the framework's own guidance for the current way to animate an element entering and leaving, and for reading a composition option in a component, before any of it is written

## 1. Contract

- [x] 1.1 The published notice input gains an optional symbol name, documented like every other symbol field
- [x] 1.2 The documentation of the lifetime on the published input says: absent means by kind, zero means stays, and what an isolated plugin may state is narrower
- [x] 1.3 The notice a distribution reads gains its symbol name and how often it was raised
- [x] 1.4 The composition options gain the position, typed as six names with bottom right as the default, and the option to leave drawing to the distribution, each documented with what it does and what it does not take away

## 2. Lifetime and holding

- [x] 2.1 The service resolves a lifetime from the stated value and the kind, from one table: absent is by kind, zero stays, error stays
- [x] 2.2 A lifetime starts when a notice is shown; the existing timer handling is extended rather than duplicated
- [x] 2.3 The service offers beginning and ending a hold; a hold stops every running lifetime and remembers what was left, and ending it runs what was left and at least the remainder
- [x] 2.4 Unit tests with fake timers: a notice without a lifetime leaves by kind; an error stays; zero stays; a stated lifetime wins; a held notice outlives its lifetime; after a hold each notice gets at least the remainder; dismissing during a hold leaves no timer behind

## 3. The bound and counting

- [x] 3.1 The service keeps the notices to be shown and the waiting line, shows at most three, and moves the longest-waiting notice up when one leaves or is dismissed
- [x] 3.2 What the service publishes as readable is the notices to be shown; replacing by identity works for a shown and for a waiting notice without changing its place
- [x] 3.3 The service is told who raises: the plugin context passes its plugin identity beside the input, and a call without one is the workbench's or the distribution's own
- [x] 3.4 A notice without a stated identity that matches a live notice of the same raiser in kind, wording, symbol and action label is counted on that notice, takes the newer action and restarts its lifetime
- [x] 3.5 Unit tests: a fourth notice waits and is shown when a slot frees; a waiting notice gets its whole lifetime; a repeat counts and restarts; a repeat of a waiting notice counts without jumping the line; a notice with an identity replaces and is not counted; the same wording from two plugins is two notices; a plugin's identity cannot be supplied through the published input

## 4. Drawing

- [x] 4.1 The frame mounts the outlet only where the composition did not leave drawing to the distribution; a test pins both
- [x] 4.2 The outlet places its region by the composed position, spans the width at the chosen edge on a narrow viewport, and orders the notices so that the newest is nearest the edge in the document and on screen alike
- [x] 4.3 The card shows the named symbol or the kind's, in the kind's colour, and takes the kind's tint and border from the existing feedback colours
- [x] 4.4 The card shows how often a notice was raised once that is more than once, worded for assistive technology through a new translated string in every shipped language
- [x] 4.5 Pointer entering and leaving the region, and focus entering and leaving it, begin and end the hold
- [x] 4.6 Notices enter and leave with a transition that a reduced-motion preference removes
- [x] 4.7 Component tests: each of the six positions; the narrow viewport; the order at the top and at the bottom edge; a named symbol; the count; the hold by pointer and by focus; the roles by kind unchanged; dismissing by keyboard

## 5. The isolated plugin's limits

- [x] 5.1 The channel's sanitiser carries the symbol name as text, and turns a stated stay, a lifetime beyond the bound and an error without a lifetime into the bound
- [x] 5.2 The channel refuses a notice once the plugin holds three, shown and waiting together, through the report path every refused call uses, and leaves the held ones unchanged
- [x] 5.3 Tests: a notice stated to stay leaves; an error leaves; a long lifetime is shortened; a fourth notice is refused and reported; a counted repeat is not a further notice; the workbench's own notice raised behind a plugin's three is shown once those have left
- [x] 5.4 An end-to-end test in the sandbox suite raises more notices from a sandboxed plugin than it may hold and checks what is shown

## 6. The workbench's own notices

- [x] 6.1 The waiting-version, failed-installation and broken-storage notices state that they stay
- [x] 6.2 The failed-save notice is raised as an error from both places that raise it; the still-unsaved notice keeps its kind and now leaves
- [x] 6.3 The tests of the update, unsaved-work and refused-capability notices pin the lifetime each one has after this change

## 7. Weavers, testbed and demo

- [x] 7.1 Apply the record from 0.2: every first-party notice that must stay states it, every other is left to leave
- [x] 7.2 The testbed weaver demonstrates a repeat, a named symbol, a notice that stays and a burst beyond the bound, so each can be looked at
- [x] 7.3 The scaffolding recipes that emit a notice are checked against the new default, and their own tests still pass
- [x] 7.4 Start the testbed and look at the notices at two positions, in light and dark, on a narrow viewport, with the pointer and with the keyboard; the demo builds against the published packages and shows the change only after a release

## 8. Documentation and verification

- [x] 8.1 The distribution's guide to dialogs and notices documents the lifetime table, the hold, the position, the bound, counting, the symbol, and drawing notices itself with a complete example that announces them
- [x] 8.2 The distribution reference no longer says that no option governs notices, and names the two options
- [x] 8.3 The weaver's guide to host services documents the new default with the one-sentence note on how to keep a notice, and that a notice offering an action should state its lifetime
- [x] 8.4 The guides for isolated plugins state the two bounds and name the plugin's own surface and its tab badge for a message that must last
- [x] 8.5 The accessibility reference states what the workbench does about timed notices and what a distribution takes on when it draws them itself
- [x] 8.6 The generated agent-facing pages are regenerated, and the packed-declaration documentation guard passes with the new field and options documented
- [x] 8.7 The accessibility scan passes over notices of every kind in light and dark
- [x] 8.8 The structure check, the bundle-size check and the documentation style check pass, each judged by its exit code
- [x] 8.9 `openspec validate --all --strict`, lint by exit code, the tests and builds of every workspace project and the complete end-to-end suite pass; the demo is left out because it builds against the published packages
