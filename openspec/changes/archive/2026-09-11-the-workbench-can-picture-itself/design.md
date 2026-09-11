## Context

See `proposal.md` — Why. What stood before the design, established by measurement rather than by
argument:

- An isolated surface is hosted in a frame carrying `sandbox="allow-scripts"` and nothing else
  (`platform/libs/core/shell/src/lib/regions/content/iframe-surface.html`). Without
  `allow-same-origin` the document has an opaque origin, so no code outside it may read what it
  rendered. This was confirmed against the running demo: a reconstruction of the hosting document
  renders such a frame as an empty rectangle.
- The workbench already speaks to every isolated surface over a channel of named methods
  (`render`, `beforeClose`, `stateChanged` in `iframe-surface.ts`, carried by Penpal). A request to
  render itself is another method on that channel, not a new mechanism.
- A distribution can already read everything else a fault report wants — open tabs, the arrangement
  of panes, the active workspace, the composed plugins and their grants, the running version —
  through the services listed in `docs/distribution-api/index.md`. The picture is the only thing
  missing, and the only thing a product cannot obtain for itself.
- The demo composes twelve plugins in the page and one frame plugin from its catalogue. A
  reconstruction that stops at frames would already capture the chrome and twelve of the thirteen
  surfaces; this change closes the thirteenth, and every one a product adds later.

## Goals / Non-Goals

**Goals:**

- Cross the sandbox boundary for pixels using the channel that already exists, so that the isolation
  story is unchanged and the new request is governed by the rules already written for that channel.
- Keep the cost of the capability off every product that never uses it.
- Make an absent surface legible in the result rather than invisible.

**Non-Goals:**

- Deciding how a product presents, annotates or delivers a report. The picture is the deliverable.
- A second way for a distribution to reach the workbench. This joins the surface that exists.
- Any behaviour for a plugin beyond marking parts of its own surface.

## Decisions

**Reconstruct the document; do not photograph the screen.**
The browser's own capture (`getDisplayMedia`) returns true pixels and includes frames without any
cooperation from them, which is genuinely attractive. It was built as a throwaway probe and works.
It was rejected because the permission prompt is not a browser's choice but a requirement of the
specification: the picker is shown every time, no grant persists, and the proposed API for capturing
one's own viewport (`getViewportMedia`) is implemented nowhere and mandates consent regardless.
Safari compounds it by offering windows and screens but not tabs. A fault report that costs a system
dialog and a target selection before it starts is a fault report that does not get written. The
trade accepted in exchange is that the result is a depiction and can differ from the screen where a
surface draws by means that cannot be re-rendered.

**Ask the surface to draw itself, rather than weakening the frame.**
A frame composed at the *embedded* level keeps its origin and could be read from outside, which would
make the whole problem disappear without any new mechanism. Rejected: isolation is the default and
the reason the level exists, and trading it away so that screenshots come out complete is the wrong
thing to buy with it, especially for a plugin that arrived from a catalogue. Asking the surface
costs one method on a channel that already carries three.

**Load the renderer when a picture is first asked for.**
Both sides need a document-to-image renderer. Shipping it eagerly would tax every plugin frame and
every application for a capability most never invoke. Deferring the import until the first request
keeps that cost with the products that chose it. The candidate measured during exploration was
`snapdom`, at roughly 52 KB gzipped, which handles Shadow DOM and web components because it renders
through the browser's own engine rather than reimplementing CSS; the older `html2canvas` was rejected
on that ground and on speed. The choice is an implementation detail and is deliberately absent from
the specification.

**A plugin may withhold parts, not the whole.**
The alternative considered was to make being pictured a revocable capability like any other. It was
rejected because the case the feature exists for is reporting a fault in a plugin, and a plugin that
could opt out would opt out of exactly that. The user is already looking at those pixels and may
photograph them by other means, so a refusal protects nobody. What a plugin genuinely needs is to
keep particular content out, and that is what it is given.

**The plugin is not told a picture is being made.**
Marking is declarative and takes effect whenever a picture happens. Handing a plugin the moment of
capture would give it a place to behave differently while being observed, which is precisely what a
fault report must not permit.

**Absence is drawn, not omitted.**
A surface that does not answer leaves an area that must be filled with something. It is filled with a
statement that the content is not included. This follows the same reasoning the platform already
applies to a missing translation and to a contribution aimed at a place that cannot render it: a
diagnostic that says what happened beats a silent gap.

## Risks / Trade-offs

- **The picture is a depiction and may differ from the screen.** A fault report whose picture is
  subtly wrong misleads the person reading it. → Where a surface draws by means that cannot be
  re-rendered, the result is wrong in the same way a blank would be, and the same marking applies. A
  product that needs certainty can still photograph the screen itself; nothing here forecloses it.
- **Compositing is where the long tail lives.** Positions, scroll offsets, device pixel ratio,
  overlays, stacking. → The first slice returns one surface's rendering and proves the boundary
  crossing; compositing is a slice of its own and can be judged on its own.
- **A slow surface holds up the picture.** → A surface that does not answer within a bounded time is
  treated as one that could not be pictured, which the specification already requires to be legible.
- **The renderer is a new dependency on both sides of the boundary.** → Loaded on demand, and the
  guarantee is written so that the choice can be replaced without touching the contract.
- **The capability reads what every surface is showing.** That is a strong thing to add. → It is
  offered to the distribution only, never to a plugin, and a plugin can withhold what must not
  travel.

## Open Questions

- Whether a picture should also be offered for a single surface rather than the whole workbench. It
  changes nothing decided here and can be added later without disturbing the guarantees.
