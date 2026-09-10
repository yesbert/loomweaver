> **Status:** approved

## Why

A distribution can name the workspace an application starts in, and the workbench honours it once —
on the very first visit, when it adopts that workspace. Every later opening restores the workspace
instead of adopting it, and the step that navigates to the workspace's own content sits behind the
adoption. Nobody navigates, so the address the application was opened at stays as it was.

What the user sees on a return: the arrangement is restored, the tab that was active is drawn as the
active one, and the content area shows whatever the address that names no content resolves to. Where
a distribution serves nothing there, that is an empty area with no message. Measured on `main`: the
stored arrangement holds `knowledge-base` as its active tab and the address is still the bare one.

NextPA reached the same end by writing it themselves: a subscription that watches every navigation
and leaves the bare address for a starting place computed out of the workspace declarations. The
workbench already knows both halves of that — which workspace is declared as the start, and which
content it holds — and stops using them after the first visit.

## What Changes

- Opening the application at an address that names no content SHALL lead to the declared starting
  workspace every time, not only the first.
- A later opening SHALL show that workspace as the user left it, not reset to its declaration: an
  opening is not a reset.
- Taking the declared start SHALL leave no step in the browser's history, so pressing back does not
  return to the address that named nothing.
- A declaration that names no content of its own keeps today's behaviour: the address is left alone
  and what a distribution serves there is what the visitor sees. Our own demo is this case, and its
  chromeless surface at the bare address goes on being what a return shows.
- A deep link still wins, as it does today, and a claimed address still decides the workspace.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `workspaces`: the requirement that lets a distribution say where a first visit starts is renamed
  and widened to every opening, and the scenario stating that a returning user is not moved is
  replaced by what a return now does.

## Impact

- `platform/libs/core/shell/src/lib/workspace/workspace.service.ts` — the step that chooses the
  address sits behind the adoption of a workspace.
- `platform/libs/core/shell/src/lib/workspace/active-workspace.service.ts` — adoption happens once
  in the life of a stored workspace, which is what makes the step unreachable afterwards.
- `platform/libs/core/shell/src/lib/regions/pane/tree/pane-tree-storage.ts` — a distribution whose
  working state reads back asynchronously has no arrangement yet when the workspace is ready.
- NextPA Studio and NextPA platform-admin can drop the starting-place computation and the
  bare-address subscription in `libs/sign-in` and `libs/inventory` once they adopt the release. That
  is theirs to do, not part of this change.
