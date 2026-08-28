## Context

See proposal.md — *Why*. The constraint that shapes everything here: `@loom/frame-kit` is not a
module and must not become one. Its bundle is an IIFE loaded by a `<script>` tag; it defines the
custom elements and assigns the frame object to the global scope as a side effect of running. A
plugin author never imports it, and a surface is often plain HTML with a script tag rather than a
compiled project.

The five shapes that describe that global are already written, already documented and already
correct. They stop at the bundler because esbuild emits no declarations.

## Goals / Non-Goals

**Goals**

- An author writing a surface in TypeScript gets the frame object checked, without importing
  anything and without hand-copying a declaration into their project.
- The description cannot drift from what the bundle actually installs.
- The residue entry is resolved rather than trimmed.

**Non-Goals**

- Making the package importable. No `main`, no `exports`, no module entry. A surface loads it by
  reference and that is the whole delivery model.
- Typing the `<lw-*>` elements' attributes for JSX or template checkers. Elements are reached by tag
  and their contract is the tag plus its attributes; a per-framework typing story is a separate
  question nobody has asked for.
- Typing the Penpal bundle. It ships alongside and carries its own upstream types.

## Decisions

**An ambient declaration, not an exported module.** `declare global` is what matches how the thing
is loaded: the author references the file once in their `tsconfig` and the global is known
everywhere, exactly as the script makes it known at run time. Declaring it as a module would type an
import nobody writes and leave the actual global untyped, which is worse than nothing because it
would look solved.

**Generated from the source, never hand-written.** The requirement says the description may not
drift from what it describes, and a hand-written mirror of five interfaces drifts the first time
somebody adds a method. The declaration is emitted by the compiler from the same entry esbuild
bundles, and the `declare global` block is appended by the same build step that writes the bundle,
so one command produces both or neither.

The alternative, keeping a hand-written `.d.ts` beside the source and trusting review, was rejected
on the same grounds the structure ratchet exists: a rule nothing measures is a rule that has already
failed somewhere nobody looked.

**The bootstrap stays out of the published surface.** The entry also exports the function that
installs the global, because the bundle calls it. A consumer never does. Publishing it would promise
a name we would then have to keep, in exchange for nothing, so it is marked internal and the
compiler strips it from the emitted declaration.

That costs one word in the comment guard's directive list. A marker that changes what the compiler
emits instructs a tool in exactly the sense the guard already exempts `@ts-…` for, and without the
exemption the marker itself becomes a comment on a symbol that is no longer published — the defect
it exists to avoid.

**The five shapes become a contract.** After this, their names and members are published surface and
are governed like any other: they may not be renamed or narrowed without a change that says so. That
is the price of the guarantee and it is the point of it.

## Risks / Trade-offs

**Documentation coverage lands as a new demand.** → Adding frame-kit to what the guards read turns
`check-api-docs` on its exports: every published name needs prose in `docs/` or the `llms` files, or
an exemption with a reason. `authoring-a-weaver.md` teaches the usage with worked examples already,
so the gap is likely to be that it teaches the calls without naming the shapes. Cheap to close, but
it is work this change owns rather than discovers late.

**A description that ships is a description that can be wrong.** → It is emitted from the source that
is bundled, so it is wrong only if the source is. The failure mode this removes is far larger: today
a surface author gets no signal at all until the frame runs.

**Five internal shapes become permanent.** → Named deliberately in the proposal's Impact. They have
been stable through the sandbox work and describe a boundary that is itself specified; if one has to
change, it changes through a change.

**The version claim needs a mechanism, not a promise.** → The bundle already stamps its version into
a banner at build time from the one version source. The declaration is emitted by the same step and
carries the same banner, so "the description ships with the thing it describes and carries its
version" is a property of the build rather than a habit.

## Migration Plan

Additive throughout: a file appears in the tarball and a manifest field appears beside it. A
distribution that ignores both is unaffected, and nothing about the served bundle changes. The
residue entry is removed in the same change that makes its six blocks legitimate, so the comment
guard is green at every point.

Rollback is `git revert`. Nothing is persisted and no consumer is required to adopt anything.

## Open Questions

Whether `docs/authoring-a-weaver.md` names the five shapes or only demonstrates the calls. It
decides whether closing the documentation demand is a sentence or a section, and it is answered by
reading the guide during implementation rather than guessing now.
