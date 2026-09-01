> **Status:** approved.

## Why

The workbench rewrites a workspace's stored arrangement in silence. Where stored content sits at an
address another declared workspace now claims, that content is dropped as the arrangement is
restored, and only a development-time message names it. The intent is sound: a product may
redeclare its workspaces between two releases, and stored state has to be read against the
declarations in force now. The means are not. Dropping is a rewrite the user never asked for and
never sees.

What that produces is on record. A workspace in the demo held a tab it should not have held, put
there by a cold deep link that arrived before its plugin did. That defect is fixed. When the fixed
build read the damaged state, it did what the requirement says: it dropped the foreign tab. The
workspace was left with nothing, because that tab occupied the only content dock it had. Emptied, a
workspace has no address of its own, so entering it navigates to the starting address, and the
starting address belongs to another workspace. The workbench settles there instead.

The workspace can no longer be entered, and it cannot be reset either, because resetting acts on the
active workspace and this one never becomes active. A user's only escape is to clear browser storage
and lose every other workspace with it. The recorded state is kept at
`demo/e2e/fixtures/damaged-payments-workspace.json`.

The requirement weighed this and got the weighing right for the case it considered: an arrangement
that grows a pane nobody opened is worse than one that loses a pane nobody sees. It did not consider
the case where the lost pane was the only one. There, "loses a pane nobody sees" becomes "cannot be
entered", which is the larger damage, not the smaller.

There is a second sign the rule is cut wrong. It already needs an exception: for products whose
working state reads back asynchronously the repair must not run, because emptying part of an
arrangement on a guess is worse than leaving one stale tab in it. That is the rule conceding its own
case. Replace the rewrite with recognition and the exception disappears with nothing to replace it.

## What Changes

- **BREAKING** Stored content that contradicts a current declaration is no longer dropped as the
  arrangement is restored. It is kept, and the contradiction is recognised instead. Products relying
  on the workbench to tidy up silently after a redeclaration will see the stored arrangement come
  back with a mark on it.
- A workspace that cannot work as its declaration describes, because its stored arrangement leaves it
  with no content of its own, is named to the user, who is offered the reset that repairs it. The
  present rule confines the message to development time on the grounds that the user "can do nothing
  about it". Once the reset can reach the workspace, that ground is gone.
- The product can turn that announcement off in its declaration, once for the whole product rather
  than per workspace. The default is on, so a product that declares nothing still leaves its users a
  way out. What the workbench recognised is readable by the product, so turning the announcement off
  buys the freedom to answer differently rather than only silence.
- A reset can name the workspace it resets, rather than always taking the active one. In the
  workspace dialog this is a control on every row, reachable without first entering the workspace,
  and it confirms before discarding as deleting already does.
- Resetting the application's own arrangement can be extended to every workspace's arrangement. It is
  offered as a checkbox on that one action and is not remembered as a setting, because it describes
  this reset rather than the user's preference.
- The exception that suspends the repair for asynchronously readable working state is removed. With
  nothing being rewritten there is nothing to suspend, and every product is treated alike.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspaces`: the requirement *Stored content a workspace may no longer hold is dropped and named*
  is replaced. Stored content is read against the current declarations and recognised where it
  contradicts them, rather than dropped; the announcement reaches the user where the workspace cannot
  work as declared, and the product may turn that off; a reset takes the workspace it names; and a
  reset of the application's arrangement may include every workspace's arrangement.

`commands` is deliberately not modified. Both reset commands keep the names they were given, and
naming what a command resets is already required there. A guarantee stated in two capabilities is two
chances for them to disagree.

`persistence-ports` is deliberately not modified either. The exception being removed is written in
`workspaces`, and it is about what the workbench does with what it read, not about the port it read
through.

## Impact

- `platform/libs/core/shell/src/lib/regions/pane/tree/pane-tree-storage.ts` carries the rewrite that
  is being replaced, in the step that filters a restored arrangement against the current claims.
- `platform/libs/core/shell/src/lib/workspace/workspace.service.ts` decides what a switch restores and
  what a reset acts on. Both change: a restore that leaves a workspace without content is recognised,
  and `reset` takes the workspace it is given.
- `platform/libs/core/shell/src/lib/workspace/workspace-dialog.ts` and its template gain the per-row
  control and the mark that says a workspace cannot work as declared.
- `platform/libs/core/shell/src/lib/layout/app-reset.service.ts` gains the opt-in that extends the
  application reset across workspace arrangements. Its present boundary, which deliberately leaves
  workspace arrangements alone, stays the default.
- `platform/libs/core/shell/src/lib/workspace/provide-workspaces.ts` carries the product-wide setting
  for the announcement, which is published surface: consuming products see a new optional field and
  a readable account of what the workbench recognised. Nothing a product wrote stops compiling.
- `demo/e2e/fixtures/damaged-payments-workspace.json` is the recorded state the tests replay.
- Legacy source dissolved: the `workspaces` requirement *Stored content a workspace may no longer
  hold is dropped and named*, in full, including its four scenarios and its exception for
  asynchronously readable working state.
