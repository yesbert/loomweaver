> **Status:** approved.

## Why

Every product built on this platform draws the same sidebar: a list of destinations, grouped, with
the one the user is looking at marked. The demo built it once as an ordinary plugin view, on purpose,
so that a primitive would be shaped by practice rather than by guesswork. It is now needed a second
and a third time, in products the platform does not contain, and each of them would otherwise write
the same list again and get the same details wrong.

One of those details is already a guarantee. Marking the open entry means asking whether the address
shown lies under the one an entry names, and that comparison breaks on segment boundaries: `routing`
states it, and a plugin can ask the workbench. An element cannot, because it has no plugin context,
so every consumer would write it as a text prefix and `sales/quotesomething` would count as under
`sales/quotes`. The workbench should answer that question once, inside the control that draws the
list, rather than leave every product to get it wrong separately.

Now rather than later, because of order: the demo's next module is the one with six areas, folding
and a list long enough to scroll. Built against the demo's own view, that work would be written
against something this change replaces. Built against the element, the same work becomes the first
real load test of the thing the platform ships.

## What Changes

- The workbench's element vocabulary gains a navigation tree, beside the button, the icon, the
  tooltip and the select it already offers. A consumer declares groups and entries; the element
  draws them, marks the entry the current address lies under, folds groups, and reports what the
  user chose.
- Shape follows declaration rather than a rule of thumb: an entry may stand on its own without a
  group, and a group that is declared is always drawn as a group, including a group holding exactly
  one entry.
- Folding is remembered while the session lasts, seeded from a default the declaration carries per
  group. Remembering it beyond the session is deliberately out of scope; it needs somewhere to
  store it, and that is its own change.
- The element carries no domain vocabulary. It knows groups and entries, not modules, areas or
  views, and it navigates nothing: it reports a selection and the consumer decides what that means.
- Text arrives translated. The element performs no translation, and a consumer that changes language
  supplies the new text.
- The demo's navigation view becomes the element's first consumer, which is what keeps the shape
  honest: anything the demo still has to work around is a defect in the element, not in the demo.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `ui-primitives`: gains the guarantees particular to this control — that a consumer declares a
  navigation tree and the workbench draws it, that the entry the current address lies under is
  marked with the same segment rule `routing` already states, that a declared group is drawn as one,
  that folding survives while the session lasts, and that choosing an entry is reported rather than
  acted on. What already holds for every element of the vocabulary is not restated here: being
  usable by tag from any technology, working in an isolated surface, and accepting configuration as
  an attribute as well as a property.

## Impact

- `platform/libs/core/shell/src/lib/elements/` — a new element beside the existing ones, and its
  registration in the same place they are registered.
- `platform/libs/core/shell/src/index.ts` — the element's tag and class join the published surface,
  so they become contract and are covered by the packed type declarations.
- `platform/libs/core/shell/src/lib/styles/` — the classes the element draws with, since these
  elements carry no shadow root and are styled by the workbench's stylesheet.
- `demo/src/navigation/module-nav-view.html`, `demo/src/navigation/module-nav-view.ts` and
  `demo/src/navigation/fold-state.ts` — the demo's own tree, its folding and its marking are
  replaced by the element. `demo/src/navigation/module-tree.ts` stays, because it carries the
  demo's structure rather than the drawing of it.
- `openspec/changes/demo-erp-navigation/` — group 2 is reordered to follow this change, and its
  open question about an area with a single child is answered here rather than there. Task 4.1,
  which asked whether the view came out the same across modules, is answered by this change
  existing.
- Package weight: the element ships inside `@loomweaver/shell`, which the owner asked not to inflate.
  The cost is measured against the current build before the element is published, and named in the
  pull request.
