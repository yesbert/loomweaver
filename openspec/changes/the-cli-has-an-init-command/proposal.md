> **Status:** approved — approved for implementation on 2026-09-08.

## Why

Getting to a running product takes three blocks today: the Angular app, two install lines with
eight packages and a version expression, then the distribution command with four flags, then the
weaver command. Each is right, and together they are the reason the landing page cannot show one
command, the way the tools people compare us with do. The steps are mechanical, the CLI already
knows how to do every one of them except installing, and a reader should not have to assemble
them.

The owner decided on 2026-09-08: one command, run inside an existing Angular application or an
Nx workspace, that installs what the platform needs, scaffolds the distribution and a first weaver,
and says what to run next. It does not create the application; that is the framework's job, and
one line of `ng new` before it is a fair prerequisite.

## What Changes

- **`init`, a new CLI command.** Run in an Angular CLI application or in an Nx workspace, it
  detects which, detects the package manager from the lockfile, installs the runtime packages, the
  service worker matching the installed Angular version and the style pipeline (unless the
  precompiled stylesheet is chosen), scaffolds the distribution and a first weaver, and prints what
  it did and the command to serve. It only ever adds, runs twice without changing anything, and
  has a trial run that names everything and writes nothing.
- **Under Nx it produces the Nx-proper result**: the generators of the Nx collection register the
  project and the import alias, so `init` installs that collection and runs them, rather than
  writing sources that a reader would then register by hand.
- **No questions.** Every choice is a flag with a default (`--title`, `--styles`, `--weaver`,
  `--no-weaver`, `--app` where Nx has several), so the command runs the same from a terminal, a
  script, an assistant or CI.
- **The documentation follows.** Getting started opens with the one command and keeps the
  by-hand steps as the explanation of what it did. Install and run lines in the docs and on the
  landing page are shown for npm, pnpm, yarn and bun, from one source line in the markdown that the
  site renders as a tab group.
- **The landing page's primary action becomes the command** once the CLI that carries `init` is
  published; until then the button stays.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scaffolding`: one added requirement, that a single command takes an existing application to a
  running product, with its scenarios for the two workspace kinds, the package manager, the first
  weaver, the trial run and the refusal outside a workspace.

## Impact

- `platform/libs/tooling/cli/`: the command, its workspace and package-manager detection, its
  tests.
- `platform/libs/tooling/devkit/`: where the Nx path needs a generator entry it does not have.
- `docs/getting-started.md`, `docs/scaffolding.md`, `README.md`, `llms.txt`, `llms-full.txt`,
  `docs/building-with-an-assistant.md` (the three commands it quotes).
- `website/tools/sync-docs.mjs`: the package-manager tab group; `website/src/pages/index.astro`:
  the primary action, after the release.
- No legacy source is dissolved by this change.
