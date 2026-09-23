> **Status:** approved.

## Why

NextPA found a regression in 0.13.0 (finding F-038). A shared or bookmarked link below gated content
that a declared workspace claims opens the wrong surface on a cold start: the address stays in the
address bar, but the workbench shows the claimed workspace's own tab instead of the addressed content,
and says nothing about it. 0.12.2 opened the right surface. The contract already promises the
opposite, so this is a defect against an existing requirement, and NextPA cannot adopt 0.13.0 until it
is fixed.

## What Changes

- **The address tab survives the workspace settling behind a late session.** On a cold start before
  the session is known, the address below gated content opens as a tab in the workspace the
  application started in. When the session arrives and qualifies, the claiming workspace is entered
  and its declared arrangement replaces the one on screen. The address has not changed, so nothing
  puts the addressed tab back, and the pane falls back to the first tab it holds. From now on,
  replacing the whole arrangement is followed by the same step a changed address already runs: the
  addressed content gets its tab in the arrangement now on screen.
- A unit test with the real router, a claiming workspace, gated sibling surfaces that share a prefix
  and a session arriving after the first navigation. It fails on 0.13.0.

No new call, option or type.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `access-gating`: *Addressable content is gated at its address, and says why* gains the scenario
  that an address below gated content still opens at that sub-address when qualifying for it also
  moves the user into the workspace that claims it. The requirement already says so in general; the
  scenario pins the case that broke.

## Impact

- `platform/libs/core/shell/src/lib/regions/pane/tree/pane-tree.service.ts`: replacing the whole
  arrangement becomes observable.
- `platform/libs/core/shell/src/lib/regions/content/tabs/open-tabs.service.ts`: the address tab is
  synchronised again after such a replacement.
- `platform/libs/core/shell/src/lib/regions/content/routing/a-gated-address-keeps-its-sub-address.spec.ts`:
  the regression test.
- NextPA finding **F-038**. Once a release carries this, NextPA can adopt 0.13.0 together with the
  fixes for F-031 to F-036.
- Behaviour change without an API change, and only toward what the contract already says. The same
  re-synchronisation also runs after a workspace reset and after the working state of a signed-in
  person is adopted, where the addressed content now keeps its tab as well.
