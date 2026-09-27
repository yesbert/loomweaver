> **Status:** approved.

## Why

When a distribution's offline storage is broken beyond repair, the workbench recovers by
unregistering its service worker and dropping its caches before it reloads. It recognised its own
worker by the script name alone and dropped every `ngsw:` cache. Two distributions served on one
origin, which 0.14.5 guarantees works, both register `ngsw-worker.js`; so repairing one also
unregistered the other's worker and dropped the other's caches. Found while auditing the fix for
F-041. The other application loses no data, but it loses its offline copy and registers afresh on
its next load.

This is a defect against a requirement the contract already states, *A failed update is
distinguished from broken offline storage* (product-identity): recovery discards its own machinery
and caches and leaves anything belonging to another application alone.

## What Changes

- **The repair discards only the worker and the caches of the application's own base.** A worker
  counts as the shell's own when its script is `ngsw-worker.js` and its scope is the application's
  base; a cache counts when its name carries that scope, which is how Angular's service worker names
  them (`ngsw:/:…` at the root, `ngsw:/x/:…` under `/x/`). A distribution at the root of an origin it
  has to itself behaves as before.
- Unit tests with a distribution at the root and one under `/x/` on the same origin, each repaired in
  turn; the update service's own test gives its fake registration the scope every real one has.
- The update service's documentation, the PWA guide and the brief say that another distribution on
  the same origin is left alone.

No new call, option or type.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. *Recovery discards only what belongs to this application* already promises this.

## Impact

- `platform/libs/core/shell/src/lib/update/worker-repair.ts`: the repair takes the application's base
  and matches worker and caches by it.
- `platform/libs/core/shell/src/lib/update/update.service.ts`: passes the base; its JSDoc.
- `platform/libs/core/shell/src/lib/foundation/served-base.ts`: the base as a path with a trailing
  slash, the form a worker's scope takes.
- `platform/libs/core/shell/src/lib/update/worker-repair.spec.ts` and `update.service.spec.ts`.
- `docs/distribution/pwa.md`, `llms-full.txt`.
- Behaviour change without an API change, and only toward what the contract already says.
