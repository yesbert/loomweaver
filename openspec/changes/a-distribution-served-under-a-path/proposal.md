> **Status:** approved.

## Why

NextPA serves two distributions from one origin: its operator interface at the root, and the
customer's Studio for an operator at `/customer-session-admin/` (finding F-041, reported against
0.12.2 and unchanged in 0.14.4). The distribution under the path shows the strings of the one at
the root, and bare keys where that one has no namespace, and "Open in new window" opens the root
distribution instead of its own. Everything else a distribution produces already follows its base,
so these two places are the only ones that do not. The contract says nothing about serving under a
path, neither as supported nor as excluded, so NextPA had to work around both: an HTTP interceptor
that rewrites every translation request, and pop-out windows switched off.

## What Changes

- **Translations are loaded from under the application's base.** The workbench's own strings, every
  contributed namespace and the default overlay directory resolve against the base the application
  is served from, not against the origin's root. A distribution served at the root requests exactly
  what it requests today.
- **An overlay directory the distribution names keeps its meaning.** A directory given relative to
  the application resolves under the base like the default; one that starts at the origin's root is
  used as named, so a product that deliberately serves its overlays from elsewhere on its origin
  keeps doing so.
- **A pop-out opens under the application's base, and recognises itself there.** "Open in new
  window" opens the pop-out address below the base, and the new window knows it is a pop-out from
  the address below the base, not from the origin's root.
- **The brief and the distribution guides say that a distribution may be served under a path, and
  what it needs**: a base that names the path, and its assets served beside it.
- Unit tests for the loader and the pop-out address under a base, and a testbed configuration served
  under `/x/` with one browser case for the strings and the pop-out.

No new call, option or type.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-composition`: gains *A distribution may be served below a path of its origin*. Today the
  contract is silent on it; afterwards the workbench guarantees it for everything it fetches or opens
  on the distribution's behalf.

## Impact

- `platform/libs/core/shell/src/lib/i18n/transloco-loader.ts` and
  `platform/libs/core/shell/src/lib/i18n/translation-overrides.ts`: requests resolve under the base.
- `platform/libs/core/shell/src/lib/foundation/served-base.ts`: the one place that reads the base.
- `platform/libs/core/shell/src/lib/popout/popout.service.ts` and `popout-window.ts`: the pop-out
  address under the base, and the pop-out recognised below it.
- `platform/apps/loom-testbed/project.json` and `platform/apps/loom-testbed-e2e/`: a configuration
  served under `/x/` and its browser case.
- `llms-full.txt`, `docs/distribution/icons-and-i18n.md`, `docs/distribution/windows-and-sync.md`
  and the other guides that state `/i18n/` or `/popout/` as absolute addresses.
- NextPA finding **F-041**. After the release NextPA removes `translationsUnderTheBaseInterceptor`
  and switches pop-out windows back on for the session interface.
- Behaviour change for a distribution served under a path only; one served at the root makes the
  same requests as before. Additive, so it ships as a patch.
