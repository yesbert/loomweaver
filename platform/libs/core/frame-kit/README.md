# @loomweaver/frame-kit

What a LoomWeaver frame plugin loads inside its iframe, at either isolation level: the `<lw-*>`
elements, their look, the RPC transport and the `LwFrame` helper. A distribution serves the `dist/`
files same-origin under `/frame-kit/`, and every frame surface references them there. A plugin's
paint then always matches the shell it runs in, and no plugin carries a copy of its own.

## What is in `dist/`

| File                    | What it is                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `lw-elements.global.js` | the `<lw-*>` element family, with the built-in icons, and `globalThis.LwFrame`                                 |
| `lw-frame.d.ts`         | the types of `LwFrame` and of what the host pushes and asks, for a surface written in TypeScript               |
| `lw-frame.css`          | the `.lw-*` class contracts on the `--lw-*` tokens, with fallbacks for the moment before the host's first push |
| `penpal.global.js`      | the RPC transport, as `globalThis.Penpal`                                                                      |
| `snapdom.global.js`     | the renderer `LwFrame.capture` loads the first time a picture of the workbench is asked for                    |

What `LwFrame` offers is in `lw-frame.d.ts`; the guide below walks through it.

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

## Where to read on

- [Frame surfaces](https://loomweaver.dev/weaver/sandboxed-surfaces/): writing a surface that runs in
  a frame, with the state store, the pushed theme and the capture hook
- [Frame plugins](https://loomweaver.dev/distribution/frame-plugins/): serving the kit and composing
  frame plugins into a distribution
