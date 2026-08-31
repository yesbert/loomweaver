> **Status:** approved.

## Why

The workbench insets every surface from its pane edges unless the surface says otherwise. That is a
look, and a look is the product's business. A platform that contains no domain logic should not
decide how much air a product's content has around it either.

The cost is not only a matter of principle. A surface that scrolls inside the inset gets its
scrollbar pushed away from the pane edge on all four sides, so it reads as cut off at the top and
bottom. That was observed in the demo on two different surfaces, one drawn by the application and
one in a sandboxed frame, and in the frame case it cannot be fixed from the product at all without
the declaration this change makes unnecessary.

The default also points the wrong way for the common case it was chosen for. A product's simple
prose and form surfaces are easy to inset from the product's own stylesheet, once. A surface that
owns its edges cannot undo an inset the workbench applied.

## What Changes

- **BREAKING** The workbench applies no inset of its own. A surface that is shown without any
  declaration fills the pane it is mounted in.
- A distribution may set the inset for everything it composes, in the same shape the surface
  retention default already uses, so a product that wants its surfaces inset says so once.
- A surface's own declaration continues to win over the distribution's default, and continues to
  travel with the surface to every mount point.
- The declaration stops being one-way. Today a surface can only switch the inset off; it will be
  able to ask for it as well, because with the default reversed that is the direction a surface now
  needs.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surfaces`: the requirement *A surface may own its own edges* is rewritten. What changes is which
  way round the default points, and that the choice gains a second place it can be stated: once for
  a whole distribution, and per surface where a surface differs.

## Impact

- `platform/libs/core/shell/src/lib/regions/content/content-area.html` and
  `content-secondary-pane.ts` — the two places that apply the inset today.
- `platform/libs/core/shell/src/lib/provide-shell.ts` — a distribution-level default alongside
  `retention`.
- `platform/libs/core/shell/src/lib/plugin/surface-normalize.ts` and
  `plugin/sandbox/sandbox-rpc-sanitize.ts` — the latter accepts only `false` today, because that was
  the only useful value.
- `@loomweaver/plugin-sdk` — the JSDoc on the declaration in `surface.ts`, `content-route.ts` and
  `view.ts`. The field's type does not change; what it means by default does.
- `docs/reference/design-tokens.md` and `docs/authoring-a-weaver.md` both describe the current
  default in prose and must be corrected, not merely appended to.
- The demo: its dashboard currently relies on the workbench's inset and needs its own; its payments
  frame currently pays the inset twice and stops doing so without being touched.
- Every existing product on `@loomweaver/shell` sees its content go flush on upgrade. Setting the
  distribution default restores the old look in one line, and that line belongs in the release note.

No legacy source is dissolved by this change.
