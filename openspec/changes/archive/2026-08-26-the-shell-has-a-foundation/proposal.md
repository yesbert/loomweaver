> **Status:** approved.

## Why

`@loom/shell` carries 31 mutually dependent feature slices, and each one is a reason the shell cannot
be cut into separate Nx libraries: Nx refuses a project graph with a cycle in it. The number is now
measured and gated, but nothing has been done about it.

Measuring where those pairs actually come from gives a clear answer. **Seventeen of the thirty-one
hang on a single import edge**, and those edges almost never fetch behaviour. They fetch a feature
flag, an id helper, a contract type, a value type — things every slice may read and no slice owns.
The shell already has a foundation layer. It has simply never been named, so its parts sit inside
whichever feature happened to declare them first, and every reader from another slice creates a
mutual dependency that is not a real one.

## What Changes

- Five modules move into a named cross-cutting slice, alongside the two the shell already has
  (`persistence/` and `elements/`).
- The slice baseline falls from 31 mutual pairs to 21, and the checker's ratchet holds it there.
- A lint rule stops the foundation from ever importing upward, so it cannot silently grow back into
  a feature.

No behaviour changes and no published name changes. This moves declarations between files.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Nothing a consumer can observe is different: the same symbols are exported from the same
package under the same names. `.openspec.yaml` therefore sets `skip_specs: true`.

## Impact

**What moves, and what each move resolves.** Measured by simulating the slice graph before writing
any code:

| Module | Lines | What it is | Pairs resolved |
|---|---|---|---|
| `shell-features.ts` | 204 | composition-time feature flags, read by four region slices | **6** |
| `plugin/identified.ts` | 24 | `upsertById`, a pure helper on id-bearing lists | 1 |
| `regions/rail/rail-item.ts` | 17 | contract type re-exported from `@loom/plugin-sdk`, plus a DI token | 1 |
| `regions/bar/bar-item.ts` | 22 | the same shape for the bar | 1 |
| `plugin/plugin-isolation-level.ts` | 69 | the isolation-level value type and its service | 1 |

Together: **31 → 21**.

The two item modules are the clearest case. Each is under 25 lines and re-exports from
`@loom/plugin-sdk`; they are host-side adapters around a contract type, not rail or bar behaviour.
`regions/rail` and `regions/bar` were never their owners.

**What this deliberately does not touch.** The remaining 21 pairs are genuine two-way coupling
between features, and no amount of moving files resolves them: `regions/content` against
`regions/pane` (53 crossing imports), `regions/pane` against `regions/panel` (27), `plugin` against
`plugin-store`, `layout` against `regions/panel`. Each needs a design decision of its own.

**A prediction from the previous change is withdrawn.** `imports-point-one-way` said the addressing
primitives — `content-path.ts` and `tab-address.ts` — were a cheap resolution. They are not.
Simulated, moving them resolves **zero** pairs: they thin the `regions/content` against
`regions/pane` edge from 17 to 7 and leave the pair standing, because the other edges are real. The
claim was right about edge counts and wrong about pairs.

**Files touched:** the five modules above, every importer of them, and
`platform/tools/cycle-baseline.json`. Plus a lint rule for the new folder.

This change dissolves no decision record. It is the third named cross-cutting folder in the shell,
which the vertical-slice convention in `.claude/docs/reference/engineering-standards.md` sanctions as
its one exception, on the condition that such folders stay small and justified.
