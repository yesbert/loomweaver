> **Status:** approved — approved for implementation on 2026-10-10, under the owner's standing
> delegation of that day for the notice work and its follow-up.

## Why

The change that made notices expire, count and stay bounded shipped on 2026-10-10 without an
independent review, because the automatic reviewer was out of quota. A review made afterwards found
defects, each against a requirement the capabilities already carry:

- **An isolated plugin can keep its notices for ever.** Repeating a notice, or replacing one of its
  own by identity, starts the lifetime over, and neither counts as a further notice. A plugin that
  re-raises its three every few seconds holds all three places indefinitely, and a notice of the
  workbench's own raised behind them is never shown. `plugin-sandbox` says such a notice always
  leaves and that the workbench's own cannot be kept waiting beyond the bound on a lifetime.
- **The hold is left on in three situations.** Chromium sends no pointer-leave for a card that is
  removed under the pointer, so dismissing a notice by pointer leaves the others held for good.
  Keyboard focus passing through a notice that appeared under a resting pointer does the same,
  which `ui-primitives` rules out in so many words. And a pointer moving on a card that is fading
  out begins a hold with nothing shown, which the next notices inherit.
- **A plugin can replace a notice that is not its own.** A plugin's identity for a notice is its own
  name joined to the identity it chooses, and that string is compared alone. A plugin named `shell`
  choosing `update` replaces the workbench's notice that a version is waiting, action and all.
  `ui-primitives` says an identity cannot collide with the workbench's or another plugin's.

The same review found rule violations in the source and tests that pass with the behaviour they
name removed. The release waits for this change.

## What Changes

- **An isolated plugin's repeat or replacement never extends a notice.** The count and the content
  follow; the lifetime already running keeps running. The bounds on an isolated plugin's notices
  are held where the notices are held, for every way of raising, instead of being applied at the
  channel before the call.
- **Whether the pointer is attending is remembered, not asked of the browser.** Moving on the
  notices sets it; leaving them and dismissing by pointer clear it. A hold cannot begin while
  nothing is shown.
- **A notice is replaced only by whoever raised it.** An identity that is already taken by another
  raiser's notice gives the newcomer an identity of its own.
- A stated lifetime longer than a timer can hold is shortened to what it can hold, instead of
  elapsing at once.
- Dismissing from the keyboard moves the focus to the neighbouring notice rather than the first.
- Source: needless exports removed, boolean names made to read as questions, the static class lists
  back in the template where the lint guardrail reads them, and one word per thing in the internals:
  the state is a notification, as the published service has always called it, and "hold" means the
  user attending and nothing else.
- Tests: each defect above gets a test that fails before the fix; the sandbox burst test asserts the
  refusal; a browser test dismisses a notice by pointer and waits for the others to leave.
- Documentation gaps found in the same audit: the composition lookup, the workbench tour and the two
  agent-facing pages name the two notice options.

No published type changes. Nothing a trusted plugin or a distribution does behaves differently,
except that a notice dismissed from the keyboard hands the focus to its neighbour.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plugin-sandbox`: the requirement bounding an isolated plugin's notices states that a repeat or a
  replacement does not start the lifetime over.
- `ui-primitives`: the requirement on counting a repeat points at that limit, and the requirement on
  raising a notice gains the scenario that pins the collision.

## Impact

- `@loomweaver/shell`: the internal state of notifications, the notice outlet, the sandbox channel
  and its sanitiser. No change to the published declarations.
- The end-to-end suite and its helper for the startup notice.
- `docs/distribution-api/composition.md`, `docs/the-workbench.md`, `docs/weaver/sandboxed-surfaces.md`,
  `llms.txt`, `llms-full.txt`.
- Dissolves no legacy source.
