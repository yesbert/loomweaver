> **Status:** approved.

## Why

A frame plugin runs in an iframe and reaches the workbench through two things the distribution
serves it same-origin: the `<lw-*>` element family, and a global object that carries the icon
registry, the surface render state and the plugin's own keyed store. The guides teach the second one
with worked examples — `LwFrame.state.watch(...)`, `LwFrame.applySurfaceState(state)`,
`LwFrame.connectState(host)` — and a plugin author types every one of those calls into an untyped
global. A misspelled method is a runtime `undefined is not a function` inside a sandboxed frame,
which is the least observable place in the platform for a mistake to happen.

`@loom/frame-kit` ships `dist/` and nothing else: no `main`, no `types`, no `exports`. That was the
right shape for an asset bundle and it is still the right shape — the elements are installed by
running the script, not by importing it. What is missing is not a module. It is a **description**:
the five shapes that describe the global already exist in the source, fully documented, and stop at
the bundler.

The documentation sweep made the gap concrete. Those five shapes carry six JSDoc blocks that the
comment guard now reports, because they document something no consumer can reach. They are the only
entries in `comment-residue.json`, recorded rather than deleted precisely because deleting a
consumer API's documentation on the grounds that its package ships no declarations would fix the
symptom of this defect.

## What Changes

- `@loom/frame-kit` ships an **ambient declaration** describing the global its script installs, so a
  TypeScript plugin author gets `LwFrame` checked without importing anything. Ambient rather than a
  module export, because the bundle is loaded by a `<script>` tag and there is nothing to import.
- Its manifest gains a `types` entry pointing at that declaration, and `files` carries it.
- The guards read frame-kit's declarations alongside the three packages that already ship them, so
  the JSDoc on those five shapes becomes contract documentation rather than residue, and
  `check-api-docs` starts demanding prose for what the frame API exposes.
- `comment-residue.json` returns to empty and stays a ratchet.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plugin-sandbox`: *The workbench's own controls are available inside an isolated surface* gains the
  guarantee that what the distribution serves to a frame is **described** as well as served, in a
  form a typed consumer can check against, and that the description ships with the thing it
  describes so the two cannot drift apart.

## Impact

**One published package gains a promise.** `@loom/frame-kit` currently promises `dist/` and nothing
about its shape. After this it promises a declaration, which `check-package-exports` verifies is
actually in the tarball — the guard that exists for exactly this class of manifest lie.

**Five shapes stop being internal.** `LwSurfaceRenderState`, `LwStateHost`, `LwStateHandle`,
`LwStateApi` and `LwFrameApi` are declared in
`platform/libs/core/shell/src/lib/elements/lw-elements.frame.ts` and are the entry point esbuild
bundles. They become part of a published surface, which means their names and shapes are a contract
from then on.

**`comment-residue.json` empties.** Its single entry, six blocks in `lw-elements.frame.ts`, is
resolved rather than trimmed away — the blocks stay and become legitimate.

**A new demand appears.** Adding frame-kit to what the guards read turns `check-api-docs` on its
exports: every published name must be mentioned in `docs/` or the `llms` files, or listed as exempt
with a reason. `docs/authoring-a-weaver.md` already documents the usage; whether it names the shapes
is what the work will find out.

**No behaviour changes.** No element, no runtime path and no bundle output is touched. The
`.d.ts` is emitted beside the existing artifacts, and a distribution that ignores it is unaffected.

**Nothing depends on this and it depends on nothing.** It resolves a residue entry recorded by
`documentation-is-for-consumers`, which is already archived.
