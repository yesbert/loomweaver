## Context

See proposal.md for motivation.

Verified starting position (2026-08-27):

- `@loom/` appears 915 times across 287 files. The tsconfig path mappings, the seven package
  manifests and their peer dependencies on each other, the two `bin` entries, 20 files in the two
  scaffolding packages, the demo install root, five documentation files in the repository root, 16
  under `docs/`, and three Azure pipelines.
- `openspec/specs/` does not mention the scope anywhere. The only OpenSpec occurrences are in
  archived changes, which are history.
- The workspace builds the libraries from source through the tsconfig path mappings, so only the
  demo actually installs the packages by name. Its lockfile pins them against the private feed.
- Nothing is published publicly. The private feed holds 0.7.0 under the old scope.

## Goals / Non-Goals

**Goals:**

- One scope across the whole workspace, published and internal alike.
- A freshly scaffolded project compiles against packages that exist under the name the generator
  wrote.
- The demo keeps building and deploying throughout, with no window in which it is broken.

**Non-Goals:**

- Compatibility packages under the old scope. Nothing public depends on it.
- Rewriting the scope in archived changes. They record what was true when they were written.
- Renaming directories, libraries or Nx projects. Only the published name changes.

## Decisions

### 1. `@loomweaver`, and the internal libraries move with it

`loom` was unavailable as an npm organisation, and `loomweaver` matches the project, the domain and
the repository. The internal workspace libraries take the same scope rather than keeping the old
one, because two scopes side by side in one workspace is a question every reader has to answer once
and a mistake every author can make twice.

Rejected: keeping `@loom` internally and publishing under `@loomweaver`. It saves touching the
internal aliases, at the price of the published name differing from the imported one in the very
repository that teaches people how to import it.

Rejected: an unscoped name such as `loomweaver-shell`. It is available, but it gives up the grouping
that makes seven related packages read as one line, and it cannot be reserved as a namespace.

### 2. The command-line names change too

The CLI installs `loomweaver`, the MCP server `loomweaver-mcp`. The old `loom` belongs to a package
somebody else publishes, so a globally installed command by that name would compete with theirs in
the user's path for no benefit.

### 3. A mechanical replacement, verified by the existing checks

The rename is a textual replacement of the exact string `@loom/`, which is unambiguous: it never
occurs as ordinary prose. What carries the risk is not the replacement but the places where the name
is data rather than code, so those are handled deliberately: the tsconfig path mappings, the peer
dependencies the packages declare on each other, the `bin` entries, and above all the scaffolding
templates, where the scope is written into generated files and asserted on in tests.

The gate that proves it is the existing one. Lint, unit tests, the build of all seven packages and
the generator tests either pass under the new name or the rename is incomplete.

Rejected: a compatibility shim, publishing `@loom/*` packages that re-export the new ones. That is
the right move when consumers exist. None do.

### 4. The demo keeps working through one more release to the old feed

The demo does not build from source. It installs the packages from the private feed, which is the
point of it: it deploys what a consumer would get. After the rename the repository asks for
`@loomweaver/*` and the feed holds only `@loom/*`, so the demo breaks until the packages exist under
the new name somewhere it can reach.

The chosen way out is one more release, 0.7.1, to the existing private feed under the new scope,
using the publish pipeline that is still registered. It costs a tag push and nothing else, and
because releases are the maintainer's call, it waits for an explicit go.

What the plan first got wrong is the order. The publish pipeline runs on version tags and refuses to
run anywhere else, so the packages cannot exist under the new name before the rename is on `main`.
The demo therefore does not move with the rename; it stays on the old scope, keeps installing the
packages it already has from the feed, and follows in a separate pull request once 0.7.1 is
published. This is also how every previous release in this repository worked.

Rejected: renaming the demo in the same pull request. The build gate installs the demo from the
feed, so the gate would fail on packages that cannot exist yet.

Rejected: accepting a broken demo until the first npm release. The demo is publicly visible and the
gap would last as long as the whole migration does.

Rejected: pointing the demo at the workspace sources for the interim. It would keep the build green
while removing exactly the property the demo exists to demonstrate.

### 5. Before the move to GitHub, not after

The rename happens in the Azure repository, where the build gate, the publish pipeline and the demo
deployment all still run and can prove it. The move to GitHub then exports a tree that is already
correct, and the first public commit carries the final names.

Rejected: renaming after the move. The first public commit would then advertise a scope that has to
change immediately afterwards, and the proof would have to happen on pipelines that are themselves
new and unproven.

## Risks / Trade-offs

- **The scaffolding still emits the old scope somewhere** → The generator tests assert on the
  emitted imports; a missed template fails them. As a second check, a freshly scaffolded weaver is
  built once by hand before the change is called done.
- **The demo lockfile resolves against the wrong feed** → It is refreshed only after 0.7.1 exists
  under the new scope, and the demo build is run before merging.
- **The replacement hits prose that was talking about something else** → The replaced string is
  `@loom/` with the slash, which only ever introduces a package name.
- **Archived changes now disagree with the code** → Intentionally. They are dated records, and a
  short note in the migration record explains that the scope changed on 2026-08-27.

## Migration Plan

1. Rename across the workspace, including the internal aliases and the `bin` entries. The demo
   stays untouched.
2. Prove it with the existing gate, plus one hand-built scaffolded project.
3. Merge. The demo keeps installing the previous packages, so nothing breaks.
4. With the maintainer's go, bump to 0.7.1 and tag it, which publishes the renamed packages.
5. Move the demo across in a follow-up, verify it builds and deploys, then continue with the move
   to GitHub.

**Rollback.** Until the merge, nothing outside the branch is affected. After the merge, the old
packages are still in the feed and a revert restores the previous state; only the extra 0.7.1
release cannot be withdrawn, and it does no harm on a private feed.
