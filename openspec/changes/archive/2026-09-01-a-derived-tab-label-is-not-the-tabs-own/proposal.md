> **Status:** approved.

## Why

A tab that has no label of its own is given one derived from what the content declares. That
derivation is written straight back into the workspace's saved panes, as though the tab had always
carried it. So a label that was only ever a guess becomes the tab's own property, and a wrong guess
becomes permanent.

It is wrong often, and predictably. A surface registered at the root address matches every address,
because an empty pattern is vacuously satisfied. It only wins the match when nothing longer matches,
which is exactly the situation on a cold restore: a surface that registers over RPC from a sandboxed
frame has not registered yet, so the only route on offer is the one at the root. The tab is labelled
with that surface's title and icon, and the label is saved.

Observed on the live demo in a fresh profile, and locally, with no agent and no unusual timing.
Opening the payments workspace and reloading once turns the saved tab

```
{"path":"payments","closable":false}
```

into

```
{"path":"payments","title":"insights.dashboard.title","icon":"insights","closable":false}
```

From then on the payments workspace shows a tab called *Overview* whichever way it is reached, with
no further reload, because every switch restores that saved tab. Clearing browser storage is the
only escape a user finds. The testbed does not reproduce it, and that is informative rather than
reassuring: it takes a surface at the root address standing beside a late-registering one, which the
demo has and the testbed does not.

This is the same disease the change *a deep link waits for the plugin that answers it* treated on
2026-08-31. That one taught the router to wait for a plugin that has not registered, and to leave a
workspace's saved panes untouched when it cannot show what was asked for. The tab strip never
learned either half.

## What Changes

- A label the workbench derived is no longer saved as the tab's own. Only a label a tab actually
  carries — one it was opened with, or one the content refined — is written to the workspace's
  panes. A derived label is still shown; it is recomputed each time, so it corrects itself the
  moment the content that owns the address registers.
- A surface registered at the root address no longer lends its label to a different address. Where
  the address a tab carries has no declaration yet, nothing is derived, and the workbench shows the
  address, which is what the capability already requires of it.
- A tab already stamped in saved panes recovers without the user clearing storage.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-tabs`: the requirement *A tab carries its own label, and keeps it* already separates the
  label a tab carries from one the workbench derives, and already says what to do when nothing can
  be derived. It does not say that the two must stay separate in what is saved, nor that a
  declaration at the root address is not a declaration for every address. Both limits are added
  beside the guarantee they belong to, because their absence is what the implementation read as
  permission.

## Impact

- `platform/libs/core/shell/src/lib/regions/content/tabs/content-tab-projection.ts` — `toOpenTab`
  derives the label, and `toPaneTab` writes it back with no notion of where it came from.
- `platform/libs/core/shell/src/lib/regions/content/content-path.ts` — `tabRootOf` answers `''` for
  any address once the root route is the only match, which is what sends the derivation to the wrong
  declaration.
- `platform/libs/core/shell/src/lib/regions/content/tabs/open-tabs.service.ts` — the one caller that
  persists, through `updateOpen`.
- `platform/libs/core/shell/src/lib/regions/pane/drag/pane-label.ts` — `overlayTabTitle` is where a
  carried label and a derived one meet, and is the natural place for the distinction to become
  explicit.
- Anyone already carrying a stamped tab in browser storage. They are the reason recovery is in scope
  rather than left to a release note nobody reads.
- The testbed distribution needs a surface at the root address beside a late-registering one before
  a test can pin any of this.

No legacy source is dissolved by this change.
