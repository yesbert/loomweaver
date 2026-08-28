> **Status:** approved.

## Why

There are two reasons to run a plugin in a frame, and the platform currently offers only one of them.

**Distrust** is the reason we built for: code the operator did not write, held at arm's length, with
an opaque origin, no storage, no reach into the host. **Independence** is the other one: an
organisation splits its application across teams so each can build and deploy without the others,
and the frame is the seam between them. The code is entirely trusted — it is the same company's —
and what it needs is precisely what the first reason forbids: the session it is already signed in
to, its own storage, the full browser platform.

A concrete product is waiting on the second reason. Its teams deploy separately and are composed
today behind a proxy that knows everything under a path prefix is another application. For that
product the platform's frame rung is not too permissive or too strict by degrees — it is built for
the wrong reason, and using it would mean losing single sign-on and local storage to buy an
isolation nobody asked for.

The name is part of the defect. Calling the mechanism "sandbox" makes a promise about restriction,
so a reader meeting an embedded first-party application under that name has been misled by the
vocabulary before they read a line.

## What Changes

- **A frame plugin runs at a level the composition chooses.** One level is what exists today: the
  frame is stripped of its origin and reaches nothing. The other embeds an application that keeps
  an origin, and with it its session, its storage and the rest of the browser.
- **Two guarantees stop being unconditional and gain their subject.** That the plugin cannot reach
  the hosting document, and that its surface must be same-origin, are properties of the strict
  level — not of every frame. The second becomes a question of which origins the composition
  permitted, so a team application served from a sibling subdomain can be embedded at all.
- **The composition caps the level; a plugin may ask below it.** Asking is how something that needs
  no privilege limits itself, and the cap is what stops anyone who can write a catalogue from
  handing out more than the application was built to allow. A request above the cap is refused
  rather than quietly satisfied lower down. The level is not revocable — withdrawing it breaks a
  plugin rather than reducing it — but it is shown wherever permissions are shown.
- **The workbench tells a surface when it is not visible.** A frame does not learn this by itself:
  its own visibility signal follows the browser tab, not whether the workbench is showing it, so a
  hidden application keeps its timers running and keeps polling. This is what lets retention keep
  *state* without keeping *work*.
- **The consumer-facing vocabulary stops saying "sandbox" for the mechanism** and says it only for
  the strict level, where it is accurate and matches the browser's own term. This renames a
  published package and a well-known path that plugin documents hardcode. **BREAKING**, and cheapest
  now: four documents in this repository use it and nothing outside does.

## Capabilities

### Modified Capabilities

- `plugin-sandbox`: a frame plugin runs at a level the composition caps and it may ask below that
  cap; the guarantees that presuppose the strict level say so; a surface is told when it is not
  visible.

## Impact

- `platform/libs/core/shell/src/lib/plugin/sandbox-plugin-runtime.ts` — the frame's restrictions
  become a property of the registration rather than the constant at line 275.
- `platform/libs/core/shell/src/lib/regions/content/iframe-surface.html` — the same constant on the
  visible surface.
- `platform/libs/core/shell/src/lib/plugin/sandbox-rpc-sanitize.ts` — the same-origin check at the
  RPC seam becomes a check against what the composition permitted.
- The published contract: the provider that registers frame plugins, the one that wires a catalogue
  (which gains the cap for what that catalogue may confer), and `@loom/sandbox-kit` together with
  the `/sandbox-kit/` path its documents load from.
- `platform/apps/loom-testbed/public/*/` — the four plugin documents that hardcode that path.
- `docs/plugins.md`, `docs/building-a-distribution.md`, `docs/authoring-a-weaver.md` — the three
  rungs become a mechanism and its levels.

Nothing is dissolved: no decision record or guide is superseded, and no capability is removed.
The capability file keeps its path, because a delta cannot move one; whether the contract file is
eventually renamed to match the vocabulary is recorded in the design note as a separate question.

**Not in scope:** authenticating a frame plugin against an API, which is `plugin-data-access` and is
undecided; splitting the asset kit, which the design note argues against and replaces with a
different eventual question; and the measurement this change rests on for browsers other than
Chromium, which is an open task rather than an assumption.
