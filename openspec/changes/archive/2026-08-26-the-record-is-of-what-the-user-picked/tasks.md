## 1. The capability

- [x] 1.1 Reword the requirement covering the one execution seam in
      `openspec/specs/commands/spec.md` so it claims uniformity only for what the seam decides —
      access gating, the detached-window rule and failure reporting — and points at the search
      requirement for the record.
- [x] 1.2 Reword the requirement covering the search so it names the one writer, says no other
      trigger adds to the record, and carries the reason the record is narrow.

## 2. Pinning it

- [x] 2.1 Test that a command run by its shortcut does not join the recently-used heading, in
      `platform/libs/core/shell/src/lib/commands/`.
- [x] 2.2 Test that a command triggered from an item in the chrome does not join it either.
- [x] 2.3 Test that a command invoked by its identity does not join it.
- [x] 2.4 Test that a command the user picks in the search does join it, so the tests pin both
      directions rather than only the absence. Already covered by the existing palette test "a run
      command leads the next open under a 'Recently used' section"; verified rather than duplicated.

## 3. Documentation

- [x] 3.1 Check `docs/reference/host-services.md` and `docs/authoring-a-weaver.md` where they
      describe the recently-used list, and correct any sentence that implies a wider record than the
      requirement now states. Neither claims anything about who writes it, so neither needed a
      change; the storage-key inventory and the feature switch in
      `docs/building-a-distribution.md` were checked too and are accurate.
- [x] 3.2 Check `llms-full.txt` for the same claim, since it mirrors the contract for a reader that
      never opens the specs. It said the palette surfaces the "last-run" commands, which reads as
      every route; corrected to what the user last picked there, with the reason.

## 4. Verification

- [x] 4.1 Run `openspec validate --all --strict`, the shell test suite and the workspace lint.
- [x] 4.2 Confirm no source file outside the tests changed, since this change corrects what is
      guaranteed rather than what happens.
