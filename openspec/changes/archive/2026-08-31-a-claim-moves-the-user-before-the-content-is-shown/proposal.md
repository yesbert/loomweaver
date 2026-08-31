> **Status:** approved.

## Why

A command that opens content at an address another workspace claims leaves the tab behind in the
workspace that happened to be active, and that workspace is then written to storage in that state.
One click corrupts a workspace permanently, and nothing the user can do from inside the application
repairs it.

Measured in the demo. Starting from a clean profile in the `dashboard` workspace, the assistant's
"Open the quote for Nordwind Logistik." runs the command `quotes.open`, which keeps a tab at
`quotes/q-0007`. Before the click the dashboard has no content dock at all. After it:

```
dashboard: tabs=["quotes/q-0007"]  active=quotes/q-0007     <- does not belong here
quotes:    tabs=["quotes/q-0005","quotes/q-0007"]  active=quotes/q-0005
activeWs:  quotes
```

The claim did fire: the user ends up in `quotes`. But the tab was opened first, into the dashboard,
and the dashboard's stored dock now holds it. From then on every switch to the dashboard restores
that dock, so the workbench navigates to `/quotes/q-0007`, and the address never returns to `/`
again. The workspace shows its own content under a foreign address, which is the state the
requirement exists to prevent.

The capability already says the opposite, and says it for exactly this route:

> Otherwise the address SHALL decide, and the workbench SHALL activate the workspace that claims it
> and SHALL then show the content there, so that a document is never laid over an arrangement built
> for something else.

> The claim SHALL hold however the address is reached — a link followed into the application, a
> restart, a command, a programmatic navigation, a tab a plugin opened.

Sharper still, because it describes the demo's `dashboard` exactly, which declares no content of its
own:

> A definition MAY leave the arrangement out. The workspace then holds nothing in the content area,
> and switching to it SHALL leave the content at the address that names nothing.

The address staying at `/quotes/q-0007` fails that sentence directly, without going through the
claim at all.

So this is a defect, not a gap. The order is specified, a command is named among the routes, and the
implementation runs the two steps the wrong way round.

A second defect, reproduced separately and without the assistant, is carried here because it lives
in the same stored state: **which tab is active is never persisted.** While `quotes/q-0007` is shown,
the stored dock already reads `active=quotes/q-0005`. Switch away and back and the user lands on
`q-0005`. That fails the capability's first requirement:

> Switching SHALL store what the user had and restore what the target had, so that returning finds
> it as it was left.

Whether the two share a cause is not yet known and this change does not assume they do.

## What Changes

- Content opened at a claimed address SHALL reach the claiming workspace before it is shown
  anywhere, whatever opened it: a command, a plugin, a programmatic navigation or a followed link.
  Today the ordering holds only for a link followed from outside.
- No workspace SHALL be left holding a tab for an address it does not claim, and none SHALL be
  written to storage in that state.
- Which tab a workspace has active SHALL be part of what a switch stores and restores.
- Each defect gets a test that fails against today's code before the fix lands, so neither can
  return unnoticed.
- A workspace loading a stored dock that holds an address it does not claim SHALL drop that tab,
  and SHALL say so once in development mode. Without it the fix would reach nobody who already
  triggered the bug, and every visitor to the deployed demo who followed the assistant into a quote
  is one of them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspaces`: one requirement added, that stored content a workspace may no longer hold is
  dropped as the arrangement is restored, and the developer is told.

The two defects themselves add nothing. They fail requirements the capability already states, quoted
above, and restating them would put the same guarantee in two places; they carry tests instead.

Repairing stored state is different, and the difference is worth being exact about. The existing
requirement says the claim decides and the claiming workspace is activated. An implementation could
satisfy that on restore by switching workspaces instead of dropping the tab. Both readings honour the
present text and they are not the same thing from outside. Choosing one is therefore a new guarantee,
and a guarantee that is only in the code is one nobody can look up.

## Impact

- `@loomweaver/shell`, the workspace service and the path that opens a content tab: where the claim
  is consulted relative to where the tab is added.
- `@loomweaver/shell`, the persistence of a workspace's pane tree: which tab is active is not in what
  is written today.
- The demo is the reproduction and not a target. Its assistant, its `quotes.open` command and its
  `dashboard` workspace are what made the defect visible, and none of them is at fault.
- A user of the deployed demo who has already triggered this carries a corrupted `dashboard` in
  storage, for which clearing site data is the only repair today. The hydration guard above is what
  reaches them.

No legacy source is dissolved by this change.
