## Context

The checks are pure functions in the dev kit; the command-line and assistant routes are thin
adapters. The command check reads sources with the TypeScript compiler API, which parses JavaScript
just as well. The catalogue check and the workbench's catalogue parser live in different libraries
and are kept in agreement on their field list by a guard.

## Goals / Non-Goals

**Goals:**

- Every finding a check makes is true of the workbench, and every case the audit named is pinned by
  a test.

**Non-Goals:**

- Type-checking a consumer's whole program. The command check stays a reader of registrations; it
  resolves string constants declared in the same file, not values computed elsewhere.

## Decisions

**Constants are resolved within the file.** A `const X = 'id'` declared in the file is followed;
anything else stays "unreadable", which the check already reports honestly as something it could not
judge.

**`registerCommand` is found by its callee name**, whether reached as `ctx.registerCommand`, as a
destructured binding from the context, or as a renamed binding of either.

**The manifest's kebab rule becomes a warning.** The workbench accepts any non-empty id; kebab-case
is the convention every scaffold and guide uses. Making it a runtime rule would break plugins that
work today, which nothing calls for.

**Duplicate ids are judged after parsing**, by running each entry through the same per-entry rules
first and counting only the entries that survive, so the finding names the entry the workbench drops.

**Option metadata comes from one descriptor.** The assistant server builds its schemas from the same
scaffold descriptors the Nx schema files are generated from, including `pattern` and `default`.

## Risks / Trade-offs

- [Reading `.js` brings in bundled or vendored scripts] → The command-line walker keeps its existing
  ignore rules (`node_modules`, `dist`), and an unreadable file is reported as unreadable, never as a
  failure.
