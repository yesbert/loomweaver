## Context

See proposal.md, *Why*. What shapes the approach:

- The shell reads the distribution's grants from one injection token that the composition root
  provides with a plain value. Angular keeps the last provider for such a token, so two calls to
  the grant helper leave the first one unread. Nothing warns: the first plugin's activation fails
  with the default-deny error, which reads as if the distribution had granted nothing.
- The weaver generator amends the composition root by appending three lines per weaver, one of
  them a grant call for that weaver alone. That is the honest shape for an amendment: it adds only
  what is absent and touches no value the consumer wrote. Rewriting the consumer's existing grant
  call, an object literal that may carry comments, spreads or computed entries, would break the
  amendment rule the `scaffolding` capability already states.
- The demo and every hand-written distribution use one call with every plugin in it. That shape
  must keep meaning exactly what it means today.
- `ng new` writes `src/app/app.spec.ts`, a test that renders the root component and looks for a
  heading. The distribution scaffold overwrites the root component to render the shell, so that test
  fails on the first `ng test`. The scaffold already overwrites the root component's own files under
  `--force`; the starter test sits beside them and belongs to the same shape. The recipe already
  knows whether the workspace runs tests (`withTests`) and already writes a spec for the
  composition root when it does.
- The quick-start guard builds the generated project end to end and deletes the starter test before
  building, which is how the defect stayed invisible: the guard worked around what the scaffold
  should have done, and it never ran the generated tests.

## Goals / Non-Goals

**Goals:**

- Two weavers generated one after the other into the same distribution both activate, with no
  edit by the consumer.
- `ng test` is green immediately after `distribution` runs in a fresh Angular application.
- The failure modes are pinned where they would recur: a shell test over two grant declarations,
  and the quick-start guard over two weavers and the generated tests.

**Non-Goals:**

- No change to the weaver generator's amendment. Appending a call per weaver is right once grants
  compose, and merging into a consumer's literal is the fragile alternative.
- No new way to declare grants, no grant file, no per-plugin helper. The existing helper gains one
  property, that several calls add up.
- No change to what a grant means: the intersection with the plugin's declaration, the user's
  revocations, the activation rule all stay as specified.

## Decisions

**Grants compose in the shell, not in the generator.** The grant helper registers a multi provider,
and the service that reads the token merges every declaration into one map: per plugin id, the union
of the capabilities every declaration lists for it. A plugin named in no declaration holds nothing,
exactly as today. The alternative, teaching the weaver generator to merge its entry into the
consumer's existing grant call, was rejected: it would have to rewrite a value the consumer wrote,
which the amendment rule forbids, and it would still leave a consumer who writes two calls by hand
with a silent failure. Composing in the shell fixes both routes with one behaviour and keeps the
single-call shape untouched.

**Union, not last-wins, not error.** Two declarations naming the same plugin add up. Refusing to
start on a duplicate was considered and rejected: the generator produces exactly that situation on
purpose whenever a consumer scaffolds a second weaver, and a distribution that refuses to boot after
a generator ran is the worse experience. Last-wins is what exists today and is the defect. Union is
also the reading a developer expects from two statements that each say "this plugin may".

**The distribution scaffold owns the starter test.** When the workspace runs tests, the recipe
writes `src/app/app.spec.ts` with a test that boots the root component with the composition root's
providers and asserts that the shell rendered. It sits under the same overwrite rule as the root
component files it belongs with: refused without `--force`, replaced with it. When the workspace
runs no tests, nothing is written, matching the existing scenario. The generated notes lose the
sentence that told the consumer to delete the file.

**The guard runs what a reader runs.** The quick-start guard stops deleting the starter test and
runs the generated project's tests after its build, on a project with two weavers, which is what the
tutorial's reader does. A second guard was considered and rejected: the existing one already
scaffolds the exact sequence.

## Risks / Trade-offs

- [A consumer relies on last-wins to override an earlier grant] → Nothing documented offers that,
  and the earlier grant was never read, so no working composition depends on it. Named in the
  release note all the same.
- [The generated starter test is brittle against a consumer's own providers] → It uses the
  composition root's own provider array, so whatever the consumer adds there is what the test boots
  with; it asserts only that the shell element rendered.
- [Running the generated tests lengthens the guard] → By the time of one unit test run, on a project
  that already builds; acceptable for a guard that stands in for every first-time reader.

## Migration Plan

One branch, one pull request, then the patch release. A distribution with one grant call sees no
difference. A distribution with several calls, hand-written or generated, starts working. Rollback
is a revert; nothing persists.
