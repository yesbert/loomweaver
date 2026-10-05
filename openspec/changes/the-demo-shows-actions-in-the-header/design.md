## Context

A surface action naming a command is part of the published 0.16.0 contract. The header draws it,
hides it while the session may not run the command, and offers its menu where it declares one. The
demo pins the published packages, so it can adopt this without waiting for the next release.

## Goals / Non-Goals

**Goals:**

- Each of the five actions exists once, as a command, and is drawn by the platform.

**Non-Goals:**

- Letting other demo plugins fill these headers. That needs the unreleased toolbar slot and belongs
  after the next release.

## Decisions

**Per view, the action moves to the header unless the view's purpose is the action itself.** The
decision and its reason are written here before implementation; a view that keeps a body button keeps
it by running the same command through the command service, not the module helper.

## Risks / Trade-offs

- [An icon action is less discoverable than a labelled button] → The action carries the command's
  title as its tooltip and accessible name, and its shortcut where it has one.
