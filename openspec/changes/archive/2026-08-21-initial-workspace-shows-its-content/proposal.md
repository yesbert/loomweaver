> **Status:** approved.

## Why

A product can name the workspace a first visit opens in, and that workspace can declare what its
content area holds. On a first visit the workbench lays the baseline out — the panes, the tabs and
the sidebar occupancy are all there — and then shows something else: whatever the address the
application booted with resolves to. The declared content is present as a tab and not on screen.

This is deliberate. The code says so: the boot address wins "so a shared deep link opens what it
names rather than being replaced by the workspace's own tab". The intention is right and its reach
is too wide. Someone who opens the application without a path has not been sent anywhere — they
started the app. Treating the root as if it named content spends the everyday case on the shared-link
case.

It went unnoticed because the one distribution that declares a starting workspace happens to serve a
sensible surface at its root, so the wrong content looks like the right one. No test asserts that a
declared workspace shows what it declared.

Found while giving the demo application a workspace of its own, where the effect is plain: the
workspace opens with its quote list, its side panel and a tab for a quote — and an empty content
area beside them.

## What Changes

- A first visit that boots on the root address navigates to the adopted workspace's active tab, so a
  declared workspace shows what it declares.
- An address that names content keeps winning, unchanged. The root address is not such an address,
  whatever a product may have registered there.
- Tests pin both halves, including the case that made this invisible: a product with a surface at the
  root still gets its declared workspace.

## Capabilities

### Modified Capabilities

- `workspaces`: the requirement that a distribution may say where a first visit starts gains what
  the user actually sees — the declared content, not merely the active workspace — and the limit of
  the deep-link exception is stated where the exception is.

## Impact

- `platform/libs/core/shell/src/lib/workspace/workspace.service.ts` — `layOutAdoptedWorkspace`, which
  today lays out and deliberately does not navigate.
- `platform/apps/loom-testbed-e2e/src/initial-workspace.spec.ts` — the suite that covers the
  declaration and never asserted the content.
- The demo's quotes workspace depends on this and is held until it lands.
