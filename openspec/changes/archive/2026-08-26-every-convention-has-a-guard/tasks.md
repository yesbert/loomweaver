## 1. Bring the demo into the gate

- [x] 1.1 Measure first: add a throwaway flat config to `demo/` extending the platform's rule set and
      record how many errors and warnings it reports, per rule. This number decides whether 1.4 is a
      task or a change of its own.
- [x] 1.2 Add `demo/eslint.config.mjs` carrying the same rules the platform enforces: member
      ordering, `@angular-eslint/component-max-inline-declarations`, and the Tailwind guardrail
      pointed at the demo's own stylesheet entry point. Omit the Nx boundary rules, which have no
      meaning outside the workspace.
- [x] 1.3 Add a `lint` script to `demo/package.json` and a lint step to the "Demo product" stage of
      `azure-pipelines-build.yml`.
- [x] 1.4 Fix what lint reports. Measured backlog was 4 errors and 25 warnings, small enough to
      clear outright: the four errors were `computed` fields declared after the constructor in
      `demo/src/quotes/src/lib/views/quotes-customer-view.ts` (moved above it — `computed()` is lazy,
      so initialisation order is unchanged), the 25 warnings were Tailwind class order and were
      auto-fixed. No residue, no disabled rules.
- [x] 1.5 Verify: `npm run lint` in `demo/` exits zero, and `npm run build` and `npm test` are still
      green.

## 2. Bring the website into the gate

- [x] 2.1 Add `website/eslint.config.mjs` covering the Astro project's own TypeScript, without the
      Tailwind guardrail — `website/` is not a Tailwind project.
- [x] 2.2 Add a `lint` script to `website/package.json` and a lint step to the "Docs site" stage of
      `azure-pipelines-build.yml`.
- [x] 2.3 Verify: `npm run lint` in `website/` exits zero and `npm run build` still produces the
      site.

## 3. Guard the comment policy

- [x] 3.1 Write `platform/tools/check-comments.mjs`, modelled on `check-api-docs.mjs`: collect every
      published name from the packed `.d.ts` of `@loom/plugin-sdk` and `@loom/shell`, then walk the
      sources and report every comment that is neither JSDoc on a published name, nor a functional
      directive (`eslint-disable`, `@ts-…`, `prettier-ignore`, shellcheck, the `GENERATED` banner,
      provenance banners), nor inside a template literal in a devkit recipe.
- [x] 3.2 Calibrate before believing it: run it against `@loom/plugin-sdk` alone. Its 22 commented
      files are legitimate JSDoc on the published contract, so a violation reported there is a bug in
      the checker. Do not proceed until that run is clean.
- [x] 3.3 Extend the calibration to a second known truth: `@loom/frame-kit`, `@loom/mcp` and
      `testbed-weaver` have zero comments today, so the checker must report zero for them.
- [x] 3.4 Run it across the repository and triage the findings. Two permitted-exception classes the
      first checker missed, both fixed in the checker rather than the source: configuration files
      (`*.config.*`), which standing practice exempts, and `tools/` directories, whose checkers carry
      a header stating why they exist. The remaining **61 findings in 33 files** are genuine
      violations by the policy — JSDoc on internal symbols and spec narration — and go to the residue
      per 3.7: 27 in `@loom/shell`, 25 in `@loom/devkit`, 9 in `demo/src`.
- [x] 3.5 Remove the two narrative template comments in
      `platform/libs/weavers/testbed-weaver/src/lib/views/testbed-list-view.html` lines 41 and 58.
      Leave the `eslint-disable-next-line` comment in `command-palette.html` line 50 — it is a
      functional directive.
- [x] 3.6 Add the checker to `azure-pipelines-build.yml` in the stage that already packages the
      libraries, after packaging, so the packed `.d.ts` files exist. Make it fail loudly when they do
      not, rather than passing on absent input.
- [x] 3.7 Residue shipped as `platform/tools/comment-residue.json`, one entry per file with its
      count (61 comments across 33 files). The checker fails when a file exceeds its entry **and**
      when a file drops below it, so the list has to be trimmed as the comments go.
- [x] 3.8 Residue emptied: **61 → 0**, and the list itself is gone. Doing the work exposed two
      further bugs in the checker, both the same root cause as the first two — "published" and
      "comment" were encoded too narrowly:
      - **14 were not comments at all.** They sat inside template literals in the devkit recipes and
        are emitted into consumer code, which the policy permits. The checker's own header claimed a
        template comment could never be scanned; that holds only WITHOUT `${}`. At a substitution the
        token ends and a plain scan loop carries on in code mode, so everything after the closing `}`
        — still template text — was tokenised as code. Template spans now come from the AST.
      - **10 were consumer-facing documentation of a published package.** `PACKED` read only
        `plugin-sdk` and `shell`, the two the policy names in prose, while `@loom/devkit` also ships
        declarations: the JSDoc on its recipe option types is what a consumer sees in their IDE.
        Adding devkit's packed tree raised the published-name set from 822 to 975.
      Of the 61, **24 were false positives**. The remaining 37 were real: 11 spec narrations folded
      into test names or a helper name, where the house rule says they belong, and 26 JSDoc blocks on
      internal symbols removed — spot-checked against `openspec/specs/`, which already states the
      guarantees several of them restated.

## 4. Remove one place a convention can drift

- [x] 4.1 Replace the restated rules in the "Engineering-Standards" section of `.claude/CLAUDE.md`
      with a pointer to `.claude/docs/reference/engineering-standards.md`, keeping only what
      `CLAUDE.md` alone says.
- [x] 4.2 Confirm nothing was lost: every rule removed from `CLAUDE.md` appears in
      `engineering-standards.md`. Where it does not, move it there rather than dropping it.
- [x] 4.3 Leave `CONTRIBUTING.md` and `openspec/config.yaml` self-contained, and note in
      `engineering-standards.md` that those two carry their own copies deliberately, so a future
      reader does not "fix" the duplication.

## 5. Verify

- [x] 5.1 `npx nx run-many --target=lint --target=test --target=build --all` is green in `platform/`.
- [x] 5.2 `npm run lint` is green in `demo/` and in `website/`.
- [x] 5.3 The comment checker is green, and its residue list, if any, is in the change.
- [x] 5.4 `openspec validate --all --strict` passes.
