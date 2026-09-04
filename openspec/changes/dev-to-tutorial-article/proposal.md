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

- **One tutorial-shaped article on dev.to.** A hard, real problem for Angular teams that this
  project solves well, worked through from first principles with a runnable example, and the
  project introduced only where the hand-built solution starts costing more than it returns.
  Candidate topics, one to be chosen: plugin isolation in Angular with iframes and RPC (what breaks,
  what it costs, where the boundary belongs); a desktop-like workbench in Angular (panes, tabs,
  pop-outs and what the router has to say about it).
- **A working example the reader can run.** Either a small repository or a section of the demo,
  decided with the topic.
- **The one sentence, once.** The project is named with the qualifier from
  `position-as-angular-plugin-platform` and the demo link, in the closing section, and nowhere
  before that.

No behaviour changes and no guarantee changes: the article lives on dev.to and any example beside
the repository, so the change declares `skip_specs`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change declares `skip_specs: true`.

## Impact

**Repository.** Nothing, unless the example is best served by a page in `docs/` that the article
links to; decided with the topic.

**External.** One article on dev.to under the owner's account, tags to be chosen with the topic; a
cover rendered with the existing cover tooling outside the repository.

**Depends on.** `position-as-angular-plugin-platform`, so the closing link lands on the new first
screen.

**Legacy sources dissolved.** None.
