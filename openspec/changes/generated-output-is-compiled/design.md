## Context

Recipes are pure functions returning a file map, so generating every combination costs nothing. What
costs time is compiling: a full Angular build per combination would take minutes. The TypeScript
compiler API can type-check an in-memory program in well under a second per file set, and the
Angular template parser checks template syntax without a build.

## Goals / Non-Goals

**Goals:**

- Every scaffold and every weaver feature is generated at least once and type-checked against the
  declarations consumers install.
- A recipe that names an export the contract no longer has fails in the pull request that broke it.

**Non-Goals:**

- Template type-checking (bindings against component members). That needs the Angular compiler's
  full program and is what the nightly quick start covers for the main path.
- Running the generated application. The quick start stays the end-to-end proof.

## Decisions

**Type-check against the built declarations, not the sources.** The packed `.d.ts` of the SDK and
the shell are what a consumer compiles against; the check maps the package names to them. The build
job already packs both before the other contract guards run.

**A feature matrix that covers each feature at least once**, not the full cross product: one weaver
per feature, one with all compatible features together, plus each of the other scaffolds with each
of its presets. The two mutually exclusive weaver features get one weaver each.

**Frame scripts run in a sandboxed context** with stand-ins that record calls, the way the frame
scaffold's own test already does for its surface.

*Alternative rejected:* building a throwaway Angular workspace per combination. It is the only way
to type-check templates, but it would add minutes to every pull request; the quick start already
does it nightly for the path most consumers take.

## Risks / Trade-offs

- [The declarations are not built when the check runs locally] → The check says which build step is
  missing, as the API-docs guard does, instead of failing obscurely.
