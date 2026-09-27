## Context

See proposal.md, Why. The shell registers `ngsw-worker.js` relative to the application's base, so the
worker's scope is that base. Angular's service worker names every cache it owns
`ngsw:<scope path>:<name>`. The repair ran only when the worker reports itself beyond repair, and it
matched workers by script name and caches by the `ngsw:` prefix, so it reached every distribution on
the origin.

## Goals / Non-Goals

**Goals:**
- The repair touches the worker and the caches of the application's own base, and nothing of another
  distribution on the same origin.

**Non-Goals:**
- A worker a product registered with a scope of its own choosing for the shell's script. The shell
  owns that registration and registers it at the base; a product that bypasses it is outside what
  the repair can know.
- A browser test of the repair. The service worker is off in the testbed's development build, and a
  broken worker state cannot be produced deterministically there; the unit tests model the
  registrations and caches the browser reports.

## Decisions

**Match by scope, read from the same base as everything else.** The repair receives the base as a
path with a trailing slash, the form a registration's scope takes, from the one service that already
reads the base for translations and pop-outs. A worker is the shell's own when its script is
`ngsw-worker.js` and its scope's path equals the base; a cache is its own when its name starts with
`ngsw:<base>:`. The trailing colon keeps `ngsw:/:` from matching `ngsw:/x/:`.

*Alternatives considered:*
- **Read the scope from the registration Angular made.** Angular does not expose it, and asking the
  container for the registration of the current page (`getRegistration()`) answers for the page's
  URL, which a deep link can place below a nested scope. Rejected.
- **Drop all `ngsw:` caches but only the matching worker.** The other distribution would keep its
  worker and lose its caches, so its next load would fetch everything without being told why.
  Rejected.

## Risks / Trade-offs

- [A registration without a scope in a test double] → Every real registration has one; the update
  service's test double now carries it, as the browser's does.
