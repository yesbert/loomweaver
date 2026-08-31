# Reviewing a pull request in this repository

LoomWeaver is a domain-agnostic plugin and UI platform. It contains no product logic and ships no
server: the backend seam is expressed as ports a product implements, and the UI runs standalone on
local, anonymous defaults. Products run on top of it as plugin bundles.

The conventions are in [`CONTRIBUTING.md`](../CONTRIBUTING.md), under *Code conventions*, and this
file does not repeat them. What follows is what a reviewer needs on top: the house rules that look
like defects when you do not know them, and where the contract that decides an argument lives.

## What decides whether the change is right

`openspec/specs/` is the contract, one file per capability, stating what the platform guarantees.
Where a guide, a comment or a README disagrees with it, the specification is right and the other is
the defect. A change to behaviour arrives as an approved change under `openspec/changes/` carrying
a spec delta; a pull request that alters a guarantee without one is worth raising.

## Do not suggest these

Each of these is a deliberate rule, so a suggestion against it costs the author a reply and teaches
them to skim your review.

- **Do not ask for explanatory comments, and do not add them.** A spot that needs a comment is code
  that is not readable enough, and the fix is to restructure it. The exception is JSDoc on a symbol
  a consumer can reach in the packed declarations, plus functional directives and scaffold output.
  Rationale belongs in the design note of the change that made the decision.
- **Do not suggest an inline template.** Every component template is its own `.html` file next to
  the `.ts`, because the Tailwind guardrail reads template files and markup hidden in a decorator
  slips past it.
- **Do not suggest a raw colour or a palette utility.** Only semantic design tokens: `bg-surface`,
  `text-content`, `text-brand`, `border-border`. A hard-coded colour is the one thing that cannot
  follow a theme.
- **Do not propose a `services/`, `components/` or `models/` folder.** Folders are vertical slices,
  named for the feature they carry. Grouping by type inside a slice is fine.
- **Do not cite a decision record or an ADR number.** That corpus was dissolved and a number
  resolves to nothing. Say the thing itself.
- **Do not propose `NgModule`, `*ngIf`, `*ngFor`, or decorator `@Input`/`@Output`.** Angular 22,
  idiomatically: standalone only, signals, `inject()`, the `@if`/`@for` control flow, zoneless.
- **Do not ask for a changelog entry.** Release history is written at release time in
  `docs/chronicle.md`, and it is a frozen record rather than a file a pull request edits.
- **Do not suggest adding a server, an API route or a database.** The platform ships none by
  decision. The seam surfaces here only as the frontend ports a product implements.
- **Do not suggest abstracting for a case that does not exist yet.** YAGNI and KISS beat
  completeness here, and a premature interface is a finding rather than an improvement.

## Worth raising

- Code that disagrees with the capability it belongs to in `openspec/specs/`.
- Product-specific or domain logic reaching the platform. That boundary is what the whole design is
  for. Nx tags catch an import that crosses it; reasoning that crosses it needs a human.
- A published surface changing shape without the consumers of it moving too. A required member
  added to an interface in `@loomweaver/plugin-sdk` reaches everyone who constructs one.
- Text that is not English anywhere in the repository, including commit messages and pull request
  descriptions. The repository is public.
- A bug fix without a test that fails against the old code. A test that passes either way proves
  nothing.
- Accessibility: keyboard reachability, focus order, roles and names on anything interactive. The
  target is WCAG 2.1 AA and it is a guarantee, not an aspiration.
- AI attribution in a commit message or a pull request description. It does not belong there.

## How to pitch a review

Prefer few findings that are certainly right over many that might be. A review of a version bump or
a dependency update should usually say nothing. When a finding is a matter of taste rather than a
rule, say so in the comment, so the author can close it without a debate.
