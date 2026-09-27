> **Status:** approved.

## Why

A container whose address names one of its children loses its inner arrangement as soon as its tab
goes to the background. In the testbed: open two items in the browse container, bring another tab to
the front, come back, and one item is left; the one the address names, opened afresh from the
declaration. In NextPA the same happens to an assistant opened at one of its parts. Found while
auditing the fix for F-042; it is older than that fix and is in 0.14.5.

This is a defect against a requirement the contract already states, *The arrangement travels with
the container* (containers): the inner arrangement belongs to the piece of open work, and only
closing it discards the arrangement. Putting another tab in front is not closing it.

## What Changes

- **A container's inner arrangement is kept while any tab holds the container, whatever child its
  address names.** The workbench discards the inner arrangement of a container that no tab holds any
  more. It decided that by comparing each tab's address with the container's own address, so a tab
  at a child's address (`browse/alpha/item/beta`) did not count as holding `browse/alpha`, and only
  the address bar kept the arrangement alive. It now compares the container with the content each
  tab holds, the way it already does for the address bar.
- A unit test with a container tab in the background at a child's address, and a browser case in
  the testbed's container suite: two items opened, another tab in front, back again, both items
  still there.

No new call, option or type.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. *The arrangement travels with the container* already promises this.

## Impact

- `platform/libs/core/shell/src/lib/regions/pane/container/container-dock-gc.ts`: open tabs count
  by the content they hold, not by their full address.
- `platform/libs/core/shell/src/lib/regions/pane/container/container-dock-gc.spec.ts`: the regression
  test.
- `platform/apps/loom-testbed-e2e/src/container-children.spec.ts`: the browser case, in the nightly
  suite.
- Behaviour change without an API change, and only toward what the contract already says.
