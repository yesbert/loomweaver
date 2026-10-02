## Context

The gate has one failing condition, `new_violations` at 43 against zero; coverage and duplication
pass. The list was read from the run on `4494cf49` (2026-10-02). `sonar-project.properties` carries
twelve exclusions keyed by rule and by a path pattern, each a decision that the rule does not apply
to that file.

## Goals / Non-Goals

**Goals:** a green gate with no finding hidden that was not already decided, and a guard that an
exclusion cannot silently stop matching.

**Non-Goals:**

- Touching the gate's conditions.
- New exclusions for anything that can be fixed in code.
- Re-arguing the existing exclusions. Their reasons stand; only their paths are wrong.

## Decisions

**Fix the path, keep the pattern narrow.** The exclusions name one file each. Widening them to a
directory would hide the next finding of the same rule in a neighbouring file.

**An explicit expectation beside `expectOne`.** The testing controller's `expectOne` does fail the
test when the request is missing, so the tests are sound; the rule cannot know that. Asserting on the
matched request's address says the same thing in a form the rule and a skimming reader both
recognise, and is preferred over excluding the rule for the file.

**The constructor finding is read before it is changed.** `active-workspace.service.ts` starts an
asynchronous read in its constructor. If the read is the hydration every stored value does, the fix
is the shared hydrate helper rather than a move into a lifecycle method that the service does not
have; the task says to look first.

**A check for stale exclusions, in the repository's own guard style.** It reads the properties file
and fails when a `resourceKey` pattern matches no file, with the pattern in the message. It runs in
the merge pipeline, where a moved file is caught in the pull request that moves it.

## Risks / Trade-offs

- [A fix changes behaviour by accident] → each group is its own commit, and the full unit and
  end-to-end suites run on the result.
- [Sonar reports further findings once these are gone] → the nightly summary is read again after the
  merge, and what it shows is worked in this change until the gate is green.
