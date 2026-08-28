> **Status:** approved.

## Why

Two of this project's conventions are stated four times and enforced nowhere, and one whole product
sits outside the gate that enforces the rest.

`demo/` has no `eslint.config.mjs` and no `lint` script. Its CI stage runs `build`, `pwa-check`,
`test` and `licence-check`, and nothing else. So member ordering, the Tailwind class guardrail, the
inline-template ban and the Nx boundary rules apply to everything except the product we put in front
of people. `website/` is in the same position.

The comment policy is the sharpest house rule and the only one with no checker at all. Measured
today: 88 files in `@loom/shell` carry block comments, 12 in `@loom/devkit`, 5 in `demo/src`, and
two Angular templates carry narrative comments that the rule forbids outright. Some of those
comments are permitted — JSDoc on the published contract is the documented exception — but nobody
can tell which without reading all of them, and that is exactly the state a rule without a guard
decays into.

## What Changes

- `demo/` and `website/` get a lint configuration and enter the CI gate, so the conventions apply to
  every product in the repository rather than to the platform only.
- A checker enforces the comment policy mechanically, deciding the permitted-exception question the
  way the policy already words it: JSDoc is allowed on a symbol that appears in the **packed**
  `.d.ts`, and nowhere else.
- The two narrative template comments the checker will reject are removed.
- `.claude/CLAUDE.md` stops restating `engineering-standards.md` and points at it instead, removing
  one of the four places a convention can drift.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement changes: this change adds enforcement for conventions that are already stated
and already meant to hold. Nothing a consumer of the platform can observe is different afterwards.
`.openspec.yaml` therefore sets `skip_specs: true`.

## Impact

**Unguarded today, guarded afterwards:**

- `demo/` — no `eslint.config.mjs`, no `lint` script in `demo/package.json`, no lint step in the
  "Demo product" stage of `azure-pipelines-build.yml`.
- `website/` — same, in the "Docs site" stage.
- The comment policy — stated in `.claude/CLAUDE.md`, `.claude/docs/reference/engineering-standards.md`
  §1 "Kommentare", `openspec/config.yaml` (`operations.apply.guidance`) and `CONTRIBUTING.md`
  "Code conventions", enforced by nothing.

**Known violations the new checker will reject:**

- `platform/libs/weavers/testbed-weaver/src/lib/views/testbed-list-view.html` lines 41 and 58 —
  narrative template comments. The weaver teaching exception was withdrawn; the teaching lives in
  `docs/`.
- Whatever the first full run surfaces in the 88 shell files and 12 devkit files. The count is not
  knowable before the checker exists, which is why triage is a task rather than a promise.

**Deliberately not merged:** `CONTRIBUTING.md` and `openspec/config.yaml` keep their own full
statements of the conventions. `CONTRIBUTING.md` is read by external contributors who will not
follow a link into `.claude/`, and `openspec/config.yaml` is machine-read with no link resolution.
Only `.claude/CLAUDE.md`, which restates its own repository's long-form document, loses its copy.

**Reused, not rebuilt:** `platform/tools/check-api-docs.mjs` already walks the packed `.d.ts` with
the TypeScript compiler API to collect every published name. The comment checker needs the same list
and takes it from the same place.

This change dissolves no decision record.
