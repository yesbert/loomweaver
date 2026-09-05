> **Status:** proposed — not approved for implementation yet.

## Why

The launch article on dev.to (2026-09-04) told the project's story: how AI changed the way the
author builds software and why that led to an open-source shell for Angular. It was a post about
the project. Both reviews of the marketing say the same thing about the next one: write a
tutorial about a hard problem the reader already has, where the project appears at the end as
the shortest way to the result, not as the subject. A reader who came for the problem stays for the
solution; a reader who came for a project announcement has already left.

This change captures the idea. The article is written tomorrow, in the owner's voice, from the
owner's own text.

## What Changes

- **One tutorial-shaped article on dev.to.** Topic, decided by the owner on 2026-09-05: a
  desktop-like workbench in Angular that an AI assistant can operate end to end, built in about
  twenty minutes with a real model behind it. The problem the reader already has: the teams around
  the owner are asked to cut the clicks a user makes by a large share, because the assistant is to
  do the individual steps, and an assistant that can only chat does not cut a single one. The
  article shows the assistant carrying out the steps a user would otherwise click through, and
  reaching nothing the user could not have reached.
- **A working example the reader can run.** A directory in this repository, `examples/`, built
  the way the demo is built: it installs the published packages from the registry like any
  consumer, and the build pipeline lints, builds and tests it on every pull request so it cannot
  break unnoticed. The article links to it at the release tag of publishing day, so the text and
  the code stay one snapshot, and tells the reader to fetch only that directory. The assistant is an AG-UI agent that runs in the browser and calls OpenRouter
  directly with the reader's own key, which never leaves the browser; free models exist there, so
  the tutorial costs the reader nothing. One paragraph says what changes for production: the
  agent's run moves behind the product's own endpoint, and nothing else does.
- **The one sentence, where the project first appears.** The project is the medium the workbench
  is built with, so it cannot wait for the closing section. It is named once, with the qualifier
  from `position-as-angular-plugin-platform`, "my own project" in the same sentence, and the demo
  link, at the point where the reader first types its name; the opening stays about the problem.

No behaviour changes and no guarantee changes: the article lives on dev.to and any example beside
the repository, so the change declares `skip_specs`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change declares `skip_specs: true`.

## Impact

**Repository.** A new directory `examples/assistant-workbench/` with its own `package.json`, and
a job in the build pipeline beside the demo's. Nothing under `platform/`. The demo keeps its
scripted assistant; giving it a real model with the visitor's own key is worth doing and is a
change of its own, proposed after the article is out.

**External.** One article on dev.to under the owner's account, tags to be chosen with the topic; a
cover rendered with the existing cover tooling outside the repository.

**Depends on.** `position-as-angular-plugin-platform`, so the closing link lands on the new first
screen.

**Legacy sources dissolved.** None.
