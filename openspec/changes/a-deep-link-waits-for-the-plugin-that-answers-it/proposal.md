> **Status:** proposed — not approved for implementation yet.

## Why

The workbench already promises that an address opened directly survives arriving before the plugin
that answers it: it is remembered and resolved once the content exists. It does not keep that
promise. When the address belongs to a sandboxed plugin that registers over RPC, a cold start
resolves the address first, finds no route, and reports a routing error.

That alone would be a hiccup. What makes it a defect worth its own change is what happens next. The
workbench falls back to the starting address and opens it **as a tab inside the workspace that
claimed the address it could not show**. That tab becomes the active one, it is not closable, and it
is written into the workspace's saved panes. From then on every switch into that workspace restores
it, navigates to the starting address, and the workbench settles into the starting workspace
instead. The workspace can no longer be reached from the launcher rail at all.

So a single unlucky cold start permanently redirects a workspace, and the only obvious escape a user
finds is clearing browser storage. This was reproduced end to end against the demo, and the damaged
state was reproduced independently by replaying the saved panes into a clean profile.

## What Changes

- A directly opened address whose content has not registered yet is held rather than resolved
  against an empty route table, so no routing error is reported and the address is honoured once the
  content registers. This is the existing guarantee being met, not a new one.
- An address that is opened directly and cannot be shown leaves the claiming workspace's saved panes
  untouched. Fallback content is what the user sees; it is never written into a workspace as though
  the workspace declared it.
- Tests pin both halves: one that a cold deep link into a not-yet-registered plugin route reports no
  error and resolves on registration, and one that a deep link which is never answered leaves the
  workspace's saved content as its definition describes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `routing`: the requirement *A deep link survives arriving before the plugin that answers it* gains
  a scenario for what the workbench must **not** leave behind when the address is never answered.
  The requirement's existing text is unchanged; the failure it already forbids is a defect, not a
  gap, and gets a test rather than new prose.

`workspaces` is deliberately **not** modified. The damage lands in a workspace's saved panes, but the
cause is in how a directly opened address is resolved, and a guarantee stated in two capabilities is
two chances to disagree.

## Impact

- `platform/libs/core/shell/src/lib/regions/content/routing/` — the address resolution path,
  including the guard that settles a workspace before the route is matched.
- `platform/libs/core/shell/src/lib/regions/content/tabs/` — whichever step records fallback content
  as a tab of the active workspace.
- `platform/libs/core/shell/src/lib/workspace/` — read only, to confirm that saved panes are written
  from the arrangement rather than from a failed navigation.
- No published type changes are expected. Products consuming `@loomweaver/shell` get the fix by
  upgrading; nothing they wrote needs to change.
- Already-damaged profiles are not migrated. Resetting the affected workspace restores its declared
  arrangement, which the workspaces capability already guarantees.

No legacy source is dissolved by this change.
