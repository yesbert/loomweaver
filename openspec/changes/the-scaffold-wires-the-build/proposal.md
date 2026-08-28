> **Status:** approved.

## Why

A distribution scaffolded by following the published quick start renders completely unstyled. This
was reproduced end to end against a fresh Angular application with the packages as published: the
chrome collapses into the top-left corner, every label falls back to its raw translation key, and the
console carries a service-worker registration failure. Nothing in the build says so. It exits zero.

The cause is not one bug but a seam. The scaffold writes sources and leaves the build wiring to prose,
and prose is where it rots: the quick start omits it entirely, and each of the four settings fails
silently and separately when it is missed.

- Without a PostCSS configuration Tailwind never runs. `@import 'tailwindcss'` resolves as ordinary
  CSS, so tokens and preflight arrive but **no utility class does**, and `@plugin` and `@source` ship
  verbatim into the stylesheet as at-rules no browser understands. The shell's chrome is built on
  those utilities.
- Without `optimization.styles.inlineCritical: false` the strict content-security policy in the
  generated `index.html` blocks the inline `onload` that Angular's critical-CSS pass attaches, so the
  stylesheet never applies at all. Same symptom, second and independent cause, production only.
- Without the shell's i18n assets glob every string in the chrome renders as its key.
- Without `serviceWorker` the worker that `provideShell()` registers is a 404.

This capability already requires that generated output "SHALL NOT require a consumer to fix it before
it works", and its purpose states that output which does not build is "a documentation error that
cannot hide". Output that builds cleanly and does not work is the same error, hidden. So this is a
defect against what is already guaranteed, not a new ambition.

That we never met it has a mundane explanation: `platform/.postcssrc.json` and `demo/.postcssrc.json`
exist by hand in our own workspaces, so our own routes were never the ones exercised.

## What Changes

- **The distribution scaffold writes the PostCSS configuration** at the workspace root when it emits
  the Tailwind stylesheet, and composes into a configuration that is already there rather than
  replacing it. The `precompiled` styles mode needs none and gets none.
- **The command-line route wires the Angular build target**, reaching the parity the Nx route already
  has: the stylesheet, the three asset globs, the service worker, the production
  `inlineCritical: false` and the budgets a whole application chrome needs. What the consumer already
  declared is kept.
- **The weaver scaffold wires itself in** over that route too: its own i18n glob and its `@source`
  entry, which the Nx generator writes today and the command-line route does not.
- **A scaffolded weaver reaches the shell.** When the distribution's composition root still presents
  the shape we generated, and the place to compose into is therefore unambiguous, the weaver's import
  and its three providers are written into it. When it does not, the scaffold does not guess: it
  leaves the file alone, names the lines to add, and does not report the weaver as wired in.
- **A trial run reports what it would amend**, not only what it would write, so the existing guarantee
  that a trial run is a faithful preview survives the arrival of amendment.
- **The refusal to write outside the target directory keeps its job and loses its overreach.** It
  exists to stop a consumer-supplied target from escaping; it currently also stops the generator from
  writing the workspace-root files it owns and can name. Those two are separated.
- **The guides shrink to what is genuinely left to the reader.** The quick start and the
  getting-started build-settings step describe the wiring the scaffold now performs; the by-hand
  account moves to the manual setup guide, which exists for it.
- **A nightly guard runs the published quick start end to end** against a fresh application and fails
  when the result is not the working chrome. This break went unnoticed because nothing exercised the
  path a newcomer takes. It needs a real registry install, so it belongs beside the other nightly
  work rather than in the merge gate.

## Capabilities

### New Capabilities

None. Every guarantee here belongs to `scaffolding`, and most of it is already stated there.

### Modified Capabilities

- `scaffolding`: generated output that needs build wiring gets that wiring generated rather than
  documented, on every route that can write it; a generator may amend the workspace files it names,
  preserving what the consumer declared; a trial run previews amendments as well as writes; the
  refusal of targets leading outside the given directory is scoped to consumer-supplied targets; a
  scaffolded plugin is composed into the distribution when that composition root still presents the
  generated shape, and named rather than guessed at when it does not.

## Impact

**Behaviour.** The command-line and MCP routes gain the wiring the Nx route already had; the Nx route
gains the PostCSS configuration it also lacked. No published runtime surface changes and no
`@loomweaver/*` export moves, so nothing a consumer imports is affected.

**Code.** `platform/libs/tooling/cli/src/lib/write.ts`, `run.ts` and `scaffold.ts` (amendment
alongside writing, and the scoped refusal); `platform/libs/tooling/devkit/src/recipes/angular-distribution/recipe.ts`
and `.../recipes/angular-weaver/`; `platform/libs/tooling/devkit/src/generators/distribution/generator.ts`
and `.../generators/weaver/generator.ts` with the helpers in `.../generators/shared.ts`;
`platform/libs/tooling/mcp/`.

**Guides that stop carrying instructions the scaffold now performs.** `README.md` (quick start),
`docs/getting-started.md` (the build-settings step), and the generated `LOOMWEAVER.md` inside
`recipe.ts`, whose build-wiring and styles notes describe the same manual work. The by-hand account
is not deleted; it moves to `docs/manual-setup.md`.

**Pipelines.** `.github/workflows/nightly.yml` gains the quick-start guard.

**Not in this change.** `@loomweaver/shell` declares `@ng-icons/heroicons` at `^34.0.0` while the
registry ships 35.x, so the quick start's own second `npm install` fails with `ERESOLVE` before any
of this is reached. That is a dependency range, not a scaffold, and goes on its own branch.
