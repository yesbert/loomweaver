> **Status:** approved.

## Why

A scaffolded distribution ships two searches that nothing on screen mentions. The command search
answers to `mod+k` and the search over open work answers to `mod+p`, both seeded by the shell and
both working from the first run, but the generated composition root opts into neither visible entry
point. A consumer who has not read the reference documentation meets a workbench whose two most
useful gestures are invisible, and concludes the platform does not have them.

The visible entry point that does exist has a defect that stays hidden only because nobody uses it
yet: it renders whether or not the command it opens is still there. A distribution that drops the
command search keeps a badge that shows no chord and does nothing when clicked. That contradicts
the platform's own rule that switching a capability off takes every route to it, and it becomes the
normal case the moment the scaffold turns the badge on.

## What Changes

- The search over open work gains a visible entry point of its own, opt-in like the existing one,
  placed by default in the bottom bar while the command search's entry point keeps the top bar. Each
  is a separately addressable contribution, so a distribution can move it, drop it, or keep only one.
- Both entry points are shown only while the search they open is actually reachable. Dropping the
  command takes its badge with it, rather than leaving a control that warns to the console.
- The scaffolded distribution opts into both, so a generated product shows the way into both
  searches on first run without the consumer editing anything.
- The notes the scaffold writes beside the generated product name both shortcuts and both badges,
  and say how to move them, remove them, remove the searches themselves, and bind a chord to a
  command of one's own. The last one carries a trap worth naming: binding a chord that a built-in
  command still holds leaves two commands on one chord, which resolves by registration order rather
  than by intent.
- The getting-started walkthrough names both shortcuts where it describes what the first run looks
  like.

No breaking change. Both entry points stay opt-in providers, the scaffold's use of them is
generated code a consumer owns and may delete, and no existing default placement moves.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commands`: gains a requirement that the search over open work is reachable without knowing its
  shortcut, mirroring the one the command search already has, and a requirement that a visible entry
  point is absent whenever the search it opens is not reachable. The existing requirement for the
  command search's entry point is untouched.
- `scaffolding`: a generated distribution presents the way into both searches on its first run,
  rather than leaving them reachable only by a chord the consumer has to be told about.

## Impact

Affected source:

- `platform/libs/core/shell/src/lib/commands/command-palette-entry.ts` and its template — the entry
  becomes conditional on its command being reachable, and is shared by both entry points rather than
  hard-wired to one command id.
- `platform/libs/core/shell/src/lib/commands/provide-command-palette-entry.ts` — gains a sibling for
  the search over open work; both keep the same options shape.
- The shell's published contract (`@loomweaver/shell`) gains one exported provider and its options
  type. Additive only.
- `platform/libs/tooling/devkit/src/recipes/angular-distribution/recipe.ts` — the generated
  `app.config.ts` opts into both entry points, and the generated `LOOMWEAVER.md` gains a section on
  the two searches.
- `docs/getting-started.md`, section 7.

Legacy sources dissolved by this change: none. No decision record and no prior change carries the
behaviour being altered; the conditional-rendering defect is a gap against
`openspec/specs/gesture-configuration/spec.md`, "A switch takes the affordance and the gesture
together", not a reversal of anything previously decided.
