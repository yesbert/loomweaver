> **Status:** approved.

## Why

The documentation audit of 2026-09-03 found the same faults on most pages: sentences carrying two or
three thoughts, an aside stitched in with a dash, and one term spelled two ways. The repository has
style rules for code and measures every one of them; it had none for the prose, and the prose showed
it. The owner asked for all slices of the audit to be done; this is the last, the style pass with a
guard, which comes after the structural cut so the guard measures the pages that will stay.

## What Changes

- **A short section in `CONTRIBUTING.md`, *Writing the docs*.** The four page kinds the docs follow,
  four sentence rules (one thought per sentence and under forty words, condition first, no dash as a
  sentence joint, one spelling per term), and the header every page carries.
- **A checker, `platform/tools/check-docs-style.mjs`,** run in CI beside the other guards. It fails on
  a page under `docs/` without the derived-from-specs header, on a spelling the glossary does not use,
  and on a page with more sentences over forty words than its baseline records. The baseline is a
  ratchet like `structure-baseline.json`: it may only go down, and a stale entry fails too.
- **A first shortening pass** over the pages this arc wrote or rewrote (the entry pages, the tutorial,
  the concept pages), which brings them to zero long sentences; the rest is recorded in the baseline
  as the pass still to make, page by page.

No behaviour changes and no guarantee changes: this is documentation and tooling, so the change
declares `skip_specs`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change declares `skip_specs: true`.

## Impact

**Documentation.** `CONTRIBUTING.md` gains a section; `docs/reference/operations.md` gains a row in
the guards table; `docs/getting-started.md` and `docs/building-a-distribution.md` lose a few long
sentences.

**Tooling.** One new script and its baseline under `platform/tools/`, one `npm` script, one step in
`.github/workflows/build.yml`.

**Legacy sources dissolved.** None.
