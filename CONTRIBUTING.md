# Contributing to LoomWeaver

Thanks for taking an interest. LoomWeaver is a domain-agnostic plugin & UI platform, and it stays
useful only if the core stays small. The most valuable contributions are often the smallest ones.

## How work happens here

This repository is where LoomWeaver is developed. There is no upstream, no mirror and no replay: your
pull request is reviewed and merged here, under your own name.

- **Fork, branch, pull request.** `main` is protected and takes no direct pushes, including from
  maintainers. Name a branch `feature/…`, `fix/…`, `refactor/…`, `docs/…` or `chore/…` for what it
  does.
- **The checks run on your pull request** and have to pass before it can merge. They are the same
  ones described below, so running them locally first costs you a round trip.
- **A fork's run gets no secrets.** That is deliberate and it means one thing for you: a check that
  needs a credential, such as the code-quality analysis, does not run on a fork's pull request. It
  runs after the merge instead.

The history before the first public commit is not here. LoomWeaver was developed privately until
2026 and opened at a fixed state, so `main` starts with one commit rather than several thousand.

## What to contribute

**Issues are the main channel.** Bug reports, questions and proposals are all welcome, and a
proposal costs you nothing if the answer turns out to be "that belongs in a plugin, not the core."

**Small, self-contained pull requests are welcome too**: typo and documentation fixes, a failing test
that pins a bug, a focused fix. These are cheap to review and genuinely helpful.

**For anything larger, please open an issue first.** This is not bureaucracy. What LoomWeaver guarantees is
specified under `openspec/specs/`, one file per capability, and a change that cuts against one of
those guarantees needs a conversation before you spend an evening on it. An issue gets you that
conversation before the work, not after.

This is maintained alongside other work, so please don't expect a fast turnaround. We would rather
say that plainly than promise a response time we cannot keep.

## Sign your commits (DCO)

LoomWeaver uses the [Developer Certificate of Origin](https://developercertificate.org/). There is no
CLA to sign and no copyright to assign. You keep the copyright to your contribution, and Apache-2.0
§5 already places it under the project's licence.

What the DCO adds is a per-commit statement of provenance: that you wrote the change, or took it from
a source whose licence permits submitting it here. You make that statement by adding a line to each
commit message:

```
Signed-off-by: Jane Doe <jane@example.com>
```

`git commit -s` adds it for you (`git commit --amend -s` fixes a commit you already made). Use your
real name and a working email address. The sign-off is a public, permanent part of the history.

A required check reads every commit in a pull request and fails when one carries no sign-off naming
its own author, so this is enforced rather than requested. `git rebase --signoff main` adds the line
to a branch you have already written, and the check's summary says the same thing when it fails.

## Getting set up

You need **Node 24** (see [`.nvmrc`](.nvmrc)). Everything lives in the Nx workspace under `platform/`:

```bash
cd platform
npm ci
npm run start:testbed        # the testbed weaver on https://127.0.0.1:4200
```

The dev server is HTTPS. A `prestart` hook generates a self-signed `localhost` certificate into
`platform/.certs/` when one is missing. Trust it once so the browser accepts the page. On macOS:

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain platform/.certs/aspnet-dev.pem
```

It binds the IPv4 loopback, so an IPv6 `localhost` may not answer: use `127.0.0.1`. The dev server
runs without a service worker on purpose; `npm run preview:testbed` serves a production build on
`https://127.0.0.1:4300` if you need to exercise the PWA install and update flow.

Before you push:

```bash
npx nx run-many -t lint --all
npx nx run-many -t test --all
npx nx build loom-testbed
```

Unit tests run on **Vitest**: Angular projects through `@nx/angular:unit-test` (no config file, because
the builder compiles with the project's build options and sets up the TestBed), plain-TypeScript ones
through the inferred `@nx/vitest` plugin with a `vite.config.mts` that delegates to the shared
`platform/tools/vitest-base.mts`. If you change that base, keep it listed in `namedInputs.sharedGlobals`
in `nx.json`. It sits outside every project root, so without that entry Nx will not invalidate the
cached test results.

**Use the Node version in `.nvmrc`.** Node 25 exposes an experimental Web Storage global that shadows
jsdom's `localStorage`, which fails dozens of specs with `localStorage.clear is not a function`.

End-to-end tests are Playwright: `npx nx e2e loom-testbed-e2e`. If a previous run left a dev server on
port 4200, kill it first, or the suite tests a stale build.

If your change adds something to the published API, run the documentation coverage check too. It
reads the packed type declarations and fails when an exported name appears nowhere in `docs/`:

```bash
npx nx package plugin-sdk && npx nx package shell
npm run api-docs-check
```

A name that legitimately needs no prose of its own goes into the exemption list in
`platform/tools/check-api-docs.mjs`, with a reason, so the decision is visible in review.

Three more checks read nothing but sources, so they are the cheapest to run while you work:

```bash
npm run import-cycles-check   # which way the shell's imports point
npm run structure-check       # how wide a folder is and how long a file is
npm run comments-check        # needs the packages packed first
```

`import-cycles-check` fails on a new import cycle between files, and on a new mutually dependent pair
of feature slices. The first is a latent initialisation-order bug. The second is not a defect. It is
the distance to splitting the shell into separate libraries, which Nx cannot do while a cycle exists
in the graph. Both baselines live in `platform/tools/cycle-baseline.json` and are ratchets: they may
shrink and may never grow, and the check also fails on an entry that is no longer true, so the list
gets trimmed as the tangle does.

`structure-check` fails on a folder holding more than 12 concepts and on a source file longer than
400 lines, where a concept is one non-spec `.ts` file. Its baseline in
`platform/tools/structure-baseline.json` is the same kind of ratchet, and it records today's numbers
honestly rather than pretending they are zero.

### Changing behaviour

**A change to what the platform guarantees is proposed as a change**, not written into a guide.
Create one under `openspec/changes/`, state the new guarantee as a spec delta, and put the reasoning
in its design note: the alternatives you rejected and the consequences. That way the reasoning
survives without becoming a second place the guarantee is stated.

The workflow is scripted, so you do not have to remember the artifacts: `/opsx:propose` creates a
change, `/opsx:update` revises one, `/opsx:apply` implements an approved one, and `/opsx:archive`
folds a finished one back into the specifications. `openspec list`, `openspec show <id>` and
`openspec validate --all --strict` read the same material from the command line; the last of those is
what CI-worthy work is checked with.

Every proposal opens with a status line:

```markdown
> **Status:** proposed — not approved for implementation yet.
```

A maintainer changes `proposed` to `approved`, and **an approved change is the licence to
implement**. Nothing is ever marked approved retroactively.

Work that changes no guarantee but still needs a worklist is also a change: several slices, an order,
a place to tick things off. It sets `skip_specs: true` beside `schema: spec-driven` in the change's
`.openspec.yaml` and then validates, lists, applies and archives without touching a capability. The
demo application is worked this way.

What goes straight to a branch is what needs no list at all: a dependency bump, a pipeline fix, a
focused cleanup, a correction to a guide.

**Before writing a spec delta, read the capability.** The specifications state more than most people
remember, so "we should build X" is often "X is required and the implementation does not do it".
That is a defect, and it gets a change naming the requirement it fails and a test that pins it,
never a new requirement restating what is already there.

**There are no decision records.** Sixty-three of them were dissolved into the specifications in
August 2026 and then deleted: what the platform guarantees is in `openspec/specs/`, and why it
guarantees it is in the design note of the change that specified it, under `openspec/changes/archive/`.
Do not write new ones, and **do not cite a decision number in code, in a comment or in a guide**. A
number a reader cannot resolve is noise rather than provenance. State the thing itself.

If your change touches what a package ships, check that the manifest's promises survive packing. That
means an entry in `exports`, a new asset, or a build step that writes into a package. The check inspects built
output rather than sources, so build all seven packages first:

```bash
npx nx package plugin-sdk && npx nx package shell && npx nx run shell:styles
npx nx package devkit && npx nx package ag-ui
npx nx bundle frame-kit && npx nx bundle cli && npx nx bundle mcp
npm run package-exports-check
```

It reads the packed file list of each package and fails when an entry in `exports`, `main`, `types`
or `bin` resolves to nothing. Note that `@loomweaver/shell` needs `nx run shell:styles` on top of
`nx package shell`: the stylesheet it exports is written by that separate target.

### Shaping the surface

A few rules govern how the workbench exposes what it can do. They came out of the work on the
distribution API in September 2026 and apply to every new switch, service or hook.

- **A switch moves the control, it does not remove the capability.** Whether the user can see and
  reach something, and whether the distribution's code can reach it, are two questions. A switch
  answers the first: it takes away every route the user can take. The capability stays reachable to
  the distribution that made the decision, so it can offer it again in its own place and shape.
- **The twin is the same code.** Behaviour lives in exactly one service. A command, a button, a
  menu entry and a programmatic call are triggers that call it and carry no behaviour of their own.
  Where behaviour sits in a trigger today, it moves into the service the moment a second trigger
  needs it.
- **Same names to declare, to switch and to read, and typed.** The declaration passed to
  `provideShellFeatures`, the runtime update and the signal that reads the current value share one
  vocabulary and one type. A free string would make every typo a silent no-op.
- **Offer the ability, not the reason.** The platform does not model why a distribution switches
  something: a role, a mode, an admin page. It offers the switch; the reason is the product's.
- **The platform remembers no switch; the distribution does.** A switch holds for the session and
  starts from the declaration. Whether a runtime change survives, and for whom, is decided and
  stored by the distribution through the ports it already has.
- **Switching off acts forward, not backward.** It removes the route from now on and never undoes
  what the user built with it. Whoever switches a toggle off while it sits in the inconvenient
  position locks the user out; put the state where you want it first.
- **Whoever may switch off an automatic behaviour must be able to learn its moment.** A switch
  that silences something the workbench does on its own, with no way to notice when it would have
  run, is a silent loss rather than a switch.
- **Report through state.** Facts are signals; whoever needs the moment of a change reads the
  signal in an effect. An event exists only for a moment that leaves no state behind.
- **Prevention belongs to the owner.** What holds the work decides whether it may be closed; nobody
  else vetoes it. A veto must be allowed to run into nothing, so a hook that does not answer has
  agreed, and a veto never guards the platform against itself.
- **One door.** Extend the surface that exists, the injectable shell services for a distribution
  and `ctx` for a plugin, rather than opening a second one beside it.

## Code conventions

Most of these are enforced by `nx lint`, so the fastest feedback is to run it. What fails when a rule is
broken is listed in [`docs/reference/operations.md`](docs/reference/operations.md).

- **Angular 22, idiomatically.** Standalone only, signals for state, `inject()`, the `@if`/`@for`
  control flow, zoneless/OnPush. No `NgModule` for feature code, no `*ngIf`, no decorator
  `@Input`/`@Output`. TypeScript `strict` and `strictTemplates`.
- **No comments in code.** If a spot needs an explaining comment, the code is not readable enough, so
  restructure it instead. The only exception is what third parties consume: JSDoc on a symbol a
  consumer can reach in the packed declarations. That includes a published interface's base type and
  excludes a `private` member, since that is emitted as a bare name with nothing callable under it.
  Functional directives (`eslint-disable`, `@ts-…`) and scaffold output emitted from template
  literals are exempt as well. Rationale belongs in the design note of the change that made the
  decision, not in a function body; version control is the memory, not a commented-out block. This
  applies to the demo plugin and example plugins too, because the teaching lives in `docs/`.
- **Semantic design tokens only**: `bg-surface`, `text-content`, `text-brand`, `border-border`, never
  raw palette colours. A distribution retints the whole workbench by overriding tokens, and a plugin
  paints from the same set through the sandbox boundary, so a hard-coded colour is the one thing
  that cannot follow a theme. See [`docs/reference/design-tokens.md`](docs/reference/design-tokens.md);
  a lint rule catches mistyped utilities.
- **Vertical slices, not type folders.** A folder is a feature (service, UI, contracts and specs
  together), never a `services/` or `components/` bucket. Grouping by type is fine _inside_ a slice.
  A folder holds at most 12 concepts and a source file over 400 lines must be justified; a folder
  that outgrows the threshold is cut into sub-themes named for what they do, the way
  `regions/content` and `elements/` already are.
- **Every component template lives in its own `.html` file** next to the `.ts`. Inline templates are a
  lint error, apart from trivial stubs and test hosts in specs. The reason is not taste: the Tailwind
  guardrail that rejects a mistyped utility class reads template files, and markup hidden in a
  decorator slips past it.
- **Class members are ordered** fields → constructor → public → protected → private (lint error).
- **Clean Code, pragmatically**: intention-revealing names, small functions doing one thing at one
  level of abstraction, command-query separation, early returns instead of nested conditionals,
  fail-fast with a clear message. YAGNI and KISS beat completeness, so do not abstract past the need.
- **Fix bugs test-first**: a red test that reproduces the bug, then the fix. If you change behaviour,
  check that the new test actually fails against the old code. A test that passes either way proves
  nothing.

The platform is **domain-pure**: it must contain no product-specific logic. That boundary is enforced
by Nx tags, so an import that crosses it fails lint rather than review.

## Writing the docs

The pages under `docs/` are guides: they explain and show, and the contract stays in `openspec/specs/`.
They follow [Diátaxis](https://diataxis.fr/): a tutorial (`getting-started.md`) teaches by doing, a
how-to page (`docs/weaver/`, `docs/distribution/`) does one task, a reference page (`docs/reference/`)
states facts for lookup, and a concept page (`docs/concepts/`) explains why. A page that does two of
these does neither well; when you find yourself explaining in a how-to, link to the concept instead.

Four rules for the sentences, three of them measured by `npm run docs-style-check`:

- **One thought per sentence, and under forty words.** An aside becomes its own sentence. The checker
  counts sentences over forty words per page and keeps the number from growing
  (`platform/tools/docs-style-baseline.json` is the ratchet; rewrite it with `--write-baseline` after
  you shorten a page).
- **Condition first, then consequence.** "If the surface is clean, it is destroyed", not "It is
  destroyed, provided the surface is clean."
- **No dash as a sentence joint.** A dash that stitches two clauses hides a second thought; use a full
  stop, a comma or a colon. A dash inside a heading, a table cell or code is fine, and the checker
  looks only at prose. This one has no baseline: the corpus is at zero, so any dash the check reports
  is one you added.
- **One word, one spelling, the glossary's.** `docs/glossary.md` says which of two words names a
  thing; the checker flags the spellings it does not use (a hyphenated plugin, a two-word sidebar).

The shape of the file is Prettier's, not yours: run `npx prettier --write` on a page you touched, or
`npm run docs-format-check` to see what it wants. It decides table widths, italic markers and the
blank line after the header, and it leaves the code blocks alone, so how dense a sample reads is
still your call.

Every page under `docs/` opens with a single `# Title` and the derived-from-specs header naming the
capabilities it explains, so a reader knows where the guarantee is. The three maps (the docs index,
the glossary, the operations notes) are exempt by name. Keep the tone: the reasons, the traps by name,
and nothing glossed over are what make these pages worth reading, so shorten sentences, not content.

## Commits and pull requests

Keep the change focused; a small diff is reviewed faster than a large one. Write commit messages that
say _why_, and describe in the pull request how you verified the change: which tests you ran and what
you checked by hand.

**Write in English.** Everything in this repository is English: code, comments, documentation, commit
messages and pull request text. The commit history is public, so it is read by people who share no
other language with you.

Please don't include AI attribution in commit messages or pull request descriptions.

## Security

Do not open a public issue for a vulnerability. See [`SECURITY.md`](SECURITY.md).

## Code of conduct

Participation is covered by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Licence

Contributions are licensed under the [Apache License 2.0](LICENSE), the same licence as the project.
