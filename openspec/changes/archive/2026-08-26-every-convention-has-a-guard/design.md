## Context

See proposal.md — Why. Three constraints shape the approach.

**The comment policy is not expressible in ESLint.** Its exception is not syntactic ("JSDoc is
allowed") but semantic ("JSDoc is allowed on a symbol a consumer can see"). ESLint sees one file at
a time and cannot know whether a name survives into the packed `.d.ts`. `platform/tools/check-api-docs.mjs`
already answers exactly that question: it parses
`platform/dist/libs/core/plugin-sdk/src/index.d.ts` and
`platform/dist/libs/core/shell/types/loom-shell.d.ts` with the TypeScript compiler API and collects
every exported name. That makes the checker a sibling of an existing tool, not a new kind of thing.

**`demo/` and `website/` are not Nx projects.** `demo/` is a plain Angular CLI workspace with its
own `angular.json`, `package.json` and lockfile; `website/` is Astro. Neither is reachable from
`platform/nx.json`, so `npx nx run-many --target=lint --all` will never see them however the
platform config is written. Each needs its own lint entry point and its own CI step.

**Not every comment in the repository is a defect.** The policy permits three kinds, and the checker
has to know all three or it will be turned off within a week:

1. JSDoc on the published contract, including types pulled in transitively.
2. Functional directives: `eslint-disable`, `@ts-…`, `prettier-ignore`, shellcheck directives, the
   `GENERATED` banner in `version/app-version.ts`, provenance banners on vendored files.
3. Comments inside template literals in the devkit recipes, which are emitted into consumer code.

## Goals / Non-Goals

**Goals:**

- A convention that is stated is enforced where it applies, or it is honestly marked as unenforced.
- The comment checker's verdict is derivable from the policy text, so a disagreement with it is a
  disagreement with the policy rather than with the tool.
- The first run is green, so the gate can be switched on in the same change that adds it.

**Non-Goals:**

- Merging the four prose statements of the conventions into one. Two of them have audiences that
  cannot follow a link.
- Rewriting `demo/` or `website/` to satisfy rules they have never been held to. What lint finds
  there beyond trivial fixes gets an explicit decision, not a silent rewrite.
- Adding rules that do not exist yet. This change enforces what is already written.

## Decisions

**Calibrate the checker against a known truth before trusting a single finding.** This repository
has been burned by self-written checkers three times in one session, each time producing phantom
findings while the documentation was correct. So: before the checker's output counts as a finding,
run it against `@loom/plugin-sdk`, whose 22 commented files are entirely legitimate JSDoc on the
published contract. If the checker reports violations there, the checker is wrong. Only once
`plugin-sdk` reads clean is a shell finding believable.

**Green from the first run, with an explicit residue list if needed.** The alternative, landing a
red gate and fixing afterwards, leaves `main` broken. If triage of the 88 shell files turns up more
than a handful of genuine violations, the checker ships with a named residue list, one entry per
file with the reason, and emptying it becomes its own task. A residue list that is visible in review
is honest; a gate that is switched off is not.

**Lint `demo/` and `website/` with their own configs, not by absorbing them into the Nx workspace.**
Pulling them in would change how they build, install and release, which is a far larger change than
the one being made and would put the demo's build on the platform's lockfile. Each gets a flat
config that extends the same rule set the platform uses, and a `lint` script that CI calls, in the
stage that already builds it.

**`no-unregistered-classes` needs a Tailwind entry point per project.** The platform's Tailwind
guardrail resolves its class registry from `apps/loom-testbed/src/styles.css`. `demo/` has its own
stylesheet and `website/` is not a Tailwind project at all. So the guardrail is configured per
project where it applies and simply absent where it does not, rather than pointed at a foreign
entry point that would report every one of the demo's own utilities as unknown.

**Take the copy out of `CLAUDE.md`, not out of `CONTRIBUTING.md`.** Four statements of one rule is
three chances to drift. The one that can safely become a pointer is the one whose audience is
already inside the repository with the long-form document one path away. The other three stay.

## Risks / Trade-offs

**The comment checker rejects legitimate JSDoc and blocks work** → calibrate against `plugin-sdk`
first, as above; ship a residue list rather than a wrong verdict; make the exception mechanism a
named list with a reason per entry, the way `check-api-docs.mjs` already does it.

**The checker needs a build before it can run** → it reads packed `.d.ts` files, so it depends on
`nx package plugin-sdk` and `nx package shell` having run, exactly like `check-api-docs`. It goes in
the same CI stage, after packaging, and fails loudly rather than silently passing when the artefacts
are absent.

**Linting `demo/` for the first time surfaces a large backlog** → measure before deciding. If it is
large, the fixes are their own task in this change or their own change, and the CI step lands
together with the fixes rather than before them.

**Two more CI steps make the merge gate slower** → both are lint runs over small codebases (`demo/`
has 38 TypeScript files, `website/` almost none). The e2e suite stays nightly; nothing in this
change moves work into the gate that was deliberately kept out of it.

## Open Questions

None that change the approach. What the first checker run finds in the shell and the devkit
determines the size of the triage task, not its shape.
