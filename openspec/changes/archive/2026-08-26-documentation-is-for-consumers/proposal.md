> **Status:** approved.

## Why

The rule is one sentence and it has been in `openspec/config.yaml` and the engineering standards
throughout: code explains itself, and the only comments allowed are JSDoc on the published contract,
functional directives, and comments inside template literals emitted into consumer code. The guard
that enforces it, `check-comments.mjs`, reports clean.

It reports clean for two reasons that are both defects.

**It cannot see part of the repository.** Comments are collected with a raw scanner loop, and a
scanner loop terminates early on a file whose template literals carry a substitution: at `${` the
token ends and the loop carries on in ordinary code mode until it gives up, after which the rest of
the file is simply never read. In `retained-url-pane.spec.ts` it stops after 118 tokens. **Twenty-four
files end that way, hiding 55 JSDoc blocks** from the guard that exists to find them. The header of
`check-comments.mjs` already describes this hazard for comments *inside* templates and takes those
spans from the AST; the loop that finds the comments in the first place was never given the same
treatment.

**Its rule is looser than the sentence.** A JSDoc block is permitted when **any** name in the
declaration or its neighbourhood appears anywhere in the packed declarations. That set is flat and
name-based, so it includes `private closeNow;` lines, parameter names and local variables. The
comment then rides on a coincidence: during the structure audit, three blocks survived a move into an
unpublished class purely because they happened to mention a word that occurs somewhere in a `.d.ts`,
and a fourth was caught only because it did not. That was recorded at the time as luck rather than
judgement.

Measured against the sentence rather than the approximation, **106 JSDoc blocks across 44 files
document something no consumer can reach**, and **13 plain comments** sit in ordinary code where the
rule allows none.

## What Changes

- `check-comments.mjs` collects comments from the AST instead of a scanner loop, so no file is
  partly unread.
- Its criterion becomes the written one: a JSDoc block is allowed when the symbol it documents is
  itself reachable in the packed declarations, or is a non-private member of something that is. A
  `private` member is not: it is emitted as a bare `private name;` with no type, which documents
  nothing anybody can call.
- The 113 blocks that fail the tightened rule are removed. Where a block carried reasoning worth
  keeping, that reasoning moves into this change's design note rather than being deleted.
- The six blocks in `lw-elements.frame.ts` are **kept** and recorded in `comment-residue.json` with
  their reason. They document the frame API a plugin author programs against, and they fail only
  because `@loom/frame-kit` ships assets without a typed surface. That is a packaging gap, and
  giving it one is its own change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. A comment is not a guarantee, and no requirement, published name or observable behaviour
changes. `.openspec.yaml` therefore sets `skip_specs: true`.

## Impact

**What the guard could not see.** Twenty-four files, 55 JSDoc blocks. The full list is in the design
note; the largest are `libs/core/shell/src/lib/permissions/capability-grant.service.ts` (7 of 9
unseen), `libs/core/shell/src/lib/plugin/sandbox-plugin-runtime.ts` (5 of 13) and
`libs/tooling/devkit/src/generators/shared.ts` (5 of 6).

**What fails the tightened rule, by group:**

| Blocks | Files | Group | Outcome |
|---|---|---|---|
| 87 | 37 | Shell internals — services, components, pure helpers | removed |
| 13 | 10 | Plain comments in ordinary code | removed |
| 9 | 7 | devkit and cli generator internals | removed |
| 4 | 2 | Test helpers inside spec files | removed |
| 6 | 1 | `libs/core/shell/src/lib/elements/lw-elements.frame.ts` | recorded in the residue |

**The files this change dissolves nothing from.** No source file is deleted and no symbol moves. The
only files that change shape are `platform/tools/check-comments.mjs` and
`platform/tools/comment-residue.json`.

**`comment-residue.json` stops being empty**, for the first time since the comment sweep emptied it.
That is what the file is for: it is a ratchet, it may shrink and may never grow, and the checker
fails on a stale entry, so the six cannot quietly become seven and cannot outlive the change that
resolves them.

**No behaviour, no contract.** The packed declarations must come out byte-identical: this change
removes comments and tightens a checker, and touches nothing a consumer can observe.

**Depends on nothing. Blocks nothing.** The frame-kit change that resolves the residue entry is
separate and may land before or after.
