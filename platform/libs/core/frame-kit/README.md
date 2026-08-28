# @loomweaver/frame-kit

Static UI assets for **LoomWeaver frame plugins** — at either isolation level. A distribution
serves the `dist/` files same-origin under the well-known path `/frame-kit/`; every frame surface
references them from there — so the paint always matches the host's shell version, with
no per-plugin copies to drift.

## Contents (`dist/`)

- **`lw-elements.global.js`** — one IIFE bundle defining the whole `<lw-*>` custom-element family
  (`lw-tooltip` · `lw-select`/`lw-option` · `lw-menu`/`lw-menu-item` · `lw-button` ·
  `lw-markdown` · `lw-icon` · `lw-progress-ring`) with the built-in icon set seeded. It exposes
  `globalThis.LwFrame`:
  - `setIcon(name, svg)` / `removeIcon(name)` / `hasIcon(name)` — plugin-own icons (sanitized).
  - `applySurfaceState(state)` — applies a host `render(state)` push: token values onto `:root`,
    root font size, and the `dark` class from the pushed theme.
- **`lw-frame.css`** — the compiled `.lw-*` class contracts (the host's `theme.css` resolved to
  plain CSS on `var(--lw-*)` tokens), including the light/dark token fallback ladder for the blink
  before the first token push arrives.
- **`penpal.global.js`** — Penpal as a classic global bundle (`globalThis.Penpal`) for the RPC
  channel to the host.

## Serving it (distribution)

Add an assets glob to the application build:

```jsonc
{ "input": "node_modules/@loomweaver/frame-kit/dist", "glob": "**", "output": "frame-kit" }
```

## Using it (a frame surface)

```html
<link rel="stylesheet" href="/frame-kit/lw-frame.css" />
<script src="/frame-kit/penpal.global.js"></script>
<script src="/frame-kit/lw-elements.global.js"></script>
```

The host pushes resolved design-token values over the surface RPC channel; forward them with
`LwFrame.applySurfaceState(state)` in your `render` handler and everything — elements, classes,
theme flips, tenant branding — follows the host live.

Docs: `docs/authoring-a-weaver.md` (frame surfaces) and `docs/building-a-distribution.md`
(serving the kit) in the LoomWeaver repository.
