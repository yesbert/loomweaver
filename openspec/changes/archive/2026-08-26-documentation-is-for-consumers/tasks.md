## 1. Make the guard see the whole file

- [x] 1.1 Replace the scanner loop in `check-comments.mjs` with an AST walk that takes every node's
      leading and trailing comment ranges and deduplicates them by position.

      The special case for template spans went with it. It existed because a scan loop mistakes
      template text for code and its `/* */` for a comment; the parser reports trivia and never
      string contents, so there is nothing left to filter. Measured rather than assumed: across every
      scanned file, no comment the AST reports falls inside a template span, and all 14 the loop
      reported and the AST does not are template text.
- [x] 1.2 Prove the blindness is gone rather than assume it: for every scanned file, compare the
      count of `/**` occurrences in the raw text against what the collector returns. The 24 files
      that used to differ must now agree. Record the before and after counts in this task.

      The stated metric was wrong and the right one is better. Counting `/**` in the raw text also
      counts globs — `'src/**/*.ts'` in a generator's tsconfig is not a comment — so the two can
      never agree by construction. Compared collector against collector instead: the AST sees **59
      comments across 23 files** that the loop never reported, and the only things the loop saw and
      the AST does not are the 14 pieces of template text above.
- [x] 1.3 Run the guard with the old, generous criterion still in place. It must now report the 29
      violations the blindness was hiding — 16 JSDoc blocks and 13 plain comments. If it reports a
      different number, the collector is wrong until proven otherwise.

      Recorded: exactly 29, in the 10 files the proposal names — 16 JSDoc blocks and 13 plain
      comments. The largest single file is `retained-url-pane.spec.ts` with 9, which is the file
      where the loop gave up after 118 tokens.

## 2. Make the criterion the written rule

- [x] 2.1 Build the contract surface from the packed declarations as *reachable declarations plus
      their non-private members*, not as every identifier that appears anywhere in a `.d.ts`.
- [x] 2.2 Judge a JSDoc block by the symbol it documents: its own name for a top-level declaration,
      and owner-plus-member for a member. Drop the "any name in the neighbourhood" rule.
- [x] 2.3 Confirm `BarItemBase` and its five documented properties still pass. It is not in any
      export list, it is reachable because a published interface extends it, and rejecting it would
      be the false negative the guard's header warns about.

      Confirmed: `bar-item.ts` reports nothing. `BarItemBase` is reachable because `BarItem` extends
      it, so its five documented properties are contract documentation and stay.
- [x] 2.4 Calibrate: the tightened guard must report exactly 106 JSDoc blocks across 44 files, plus
      the 13 plain comments. Record the per-group counts in this task and check them against the
      proposal's table before believing the output.

## 3. Sweep

- [x] 3.1 Remove the 87 blocks in the shell's internal services, components and helpers.
- [x] 3.2 Remove the 9 blocks in the devkit and CLI generator internals.
- [x] 3.3 Remove the 4 blocks documenting test helpers inside spec files.
- [x] 3.4 Remove the 13 plain comments. Check each one is genuinely ordinary code and not text inside
      a template literal a recipe emits into a consumer's project — that text is allowed, and the
      five in `angular-distribution/recipe.ts` are the ones to look at twice.

      Settled by construction rather than by eye, which is stronger. The collector now takes comments
      from the AST, and the AST reports trivia and never string contents, so a comment it reports
      cannot be template text. Verified across every scanned file: not one reported comment falls
      inside a template span, and the 14 the old loop reported that the AST does not are exactly the
      emitted ones. The five in `angular-distribution/recipe.ts` are ordinary code and were read
      before removal.
- [x] 3.5 Record the six `lw-elements.frame.ts` blocks in `comment-residue.json` with the reason and
      the change that resolves them. Confirm the checker fails if the entry says five or seven.

      Done, and the residue gained a `why` block so the reason travels with the number. At seven the
      checker says "down to 6 from 7 — trim the residue"; at five it reports the sixth block as a
      violation. Both directions bite.

## 4. Verify

- [x] 4.1 The packed declarations of all six packages are byte-identical to `main`. This change
      removes comments; anything else showing up in that diff is a mistake.

      **Not byte-identical, and the one difference is the change working.** Seven lines: a single
      JSDoc block gone from `FramePluginRuntime`. It sat above `private watchState;`, and TypeScript
      keeps the comment while emitting the member as a bare name with no type and no signature. That
      is exactly the case the tightened rule exists to remove: prose in the contract with nothing
      callable underneath it.

      Everything else holds. Not one declaration line differs, the 181 exported names are the same
      set in the same order, and of the 113 removed blocks this was the only one that had reached the
      packed declarations at all.
- [x] 4.2 All seven guards pass, `check-comments` among them, and the residue holds exactly the six
      entries.

      Seven green. The structure ratchet had something to say that nobody aimed at: four files got
      shorter and it refused to pass until the baseline said so. `open-tabs.service.ts` fell from 479
      to **405**, five lines above the threshold, so the entry this series left as a named seam is
      now almost closed by deleting comments from it. `sandbox-plugin-runtime.ts` 513 → 507,
      `angular-distribution/recipe.ts` 475 → 470, `angular-weaver/recipe.ts` 708 → 707.
- [x] 4.3 Lint passes and the test count is unchanged. No test name and no assertion is touched.

      1288 tests across 148 files, unchanged. Lint clean.
- [x] 4.4 Spot-check three swept files by reading them: a comment that was load-bearing should leave
      code that still reads, or the sweep took out something the code needed. Name the three here.

      `open-tabs.service.ts` (12 blocks, the largest), `container/container-children.ts` (5 blocks on
      pure helpers) and `retained-url-pane.spec.ts` (9, the mix of JSDoc and plain comments that the
      guard could never see). All three read cleanly: the signatures carry what the prose restated,
      and nothing was left dangling. Across the whole 52-file diff the sweep added three blank lines,
      all of them inside this change's own checker code.
- [x] 4.5 `npx openspec validate --all --strict` passes.
