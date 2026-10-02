> **Status:** approved.

## Why

The guides name `<lw-spinner>` among the elements a plugin uses by tag, next to the progress ring.
It is not one: the spinner exists only as a component of the workbench's own framework, which a
plugin may not import. A plugin that writes `<lw-spinner>` gets an empty unknown element; nothing
spins and nothing is announced. TreeWeaver carries two such empty spinners today and a third plugin
drew the ring by hand (its finding #46).

This is a defect against a requirement the contract already states, *The workbench's controls are
usable from any technology* (ui-primitives): the vocabulary is offered as elements usable by tag,
without depending on the workbench's own framework, including from an isolated surface.

## What Changes

- **`<lw-spinner>` becomes a custom element** with the attributes `size` (a CSS length, default
  `1.5rem`) and `label` (the accessible name; empty for none), registered with the others at
  bootstrap, registrable from the published surface, and carried in the bundle an isolated surface
  receives.
- **Its look becomes a class contract.** `.lw-spinner-ring` is defined in the theme on tokens rather
  than assembled from utility classes in a template, so the element, a plugin's own markup and an
  isolated surface draw the same ring.
- **BREAKING: the `LwSpinner` component is removed from `@loomweaver/shell`.** One tag cannot be both
  a framework component and a custom element. A distribution that imported it drops the import and
  keeps the tag, with `CUSTOM_ELEMENTS_SCHEMA` as for every other `<lw-*>` element.
- The workbench's own progress dialog uses the element.
- The guides list the spinner with its attributes where they list the other elements.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. *The workbench's controls are usable from any technology* already promises this.

## Impact

- `platform/libs/core/shell/src/lib/elements/spinner/`: `lw-spinner.element.ts` and its spec replace
  `lw-spinner.ts`, `lw-spinner.html` and `lw-spinner.spec.ts`.
- `platform/libs/core/shell/src/lib/elements/lw-elements.ts` and
  `platform/libs/core/shell/src/index.ts`: the definition is listed and exported; `LwSpinner` leaves
  the published surface.
- `platform/libs/core/shell/src/lib/styles/theme/`: the `.lw-spinner-ring` contract.
- `platform/libs/core/shell/src/lib/dialog/dialog-outlet.ts` and `.html`: the element in place of the
  component.
- `platform/libs/core/frame-kit`: the bundle and its build test carry the tag.
- `docs/reference/design-tokens.md`, `docs/weaver/sandboxed-surfaces.md`, `llms-full.txt`.
- No legacy source is dissolved.
