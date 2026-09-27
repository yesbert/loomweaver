> **Status:** approved.

## Why

NextPA found in 0.14.4 (finding F-042) that a shared, bookmarked or reloaded link to a child of a
gated container shows no child at all. The content tab carries the container's title, the inner tab
strip is empty, the address falls back to the container's own, and the pane says the view does not
exist. Sixteen of NextPA's browser tests fail on it. The fix for F-032 in 0.13.0 was meant to cover
this case and does not, so this is a defect against requirements the contract already states:
*Addressable content is gated at its address, and says why* (access-gating), *The arrangement travels
with the container* and *A container never ends up with nothing* (containers).

The F-032 fix repaired the router and was tested at the router only: its container case registered
no child surfaces and drew nothing. The case that fails needs three things together, and no test had
all three: the container is claimed by a declared workspace that is not the one the application
starts in, the identity behind the stored state is known only after the first paint, and the address
names a child.

## What Changes

- **An open container lays out its children again when its arrangement is replaced.** When the
  identity arrives after the first paint, the workbench reads the person's stored state and enters
  the workspace that claims the address. Entering it replaces the whole arrangement, including the
  container's own inner arrangement, which lives beside it. The address tab comes back (that was the
  F-038 fix), but the container on screen stays mounted and laid out its children only once, when it
  was created. It is left with nothing, and then rewrites the address to its own. From now on, an
  open container whose inner arrangement is gone lays it out again from its declaration, and the
  child the address names takes the focus, exactly as when the container is first opened.
- A unit test that mounts a container at a child's address, replaces the arrangement and asserts
  that the children are laid out again, the named child is focused and the address is kept. It fails
  on 0.14.4.
- A testbed case, as F-042 asks: a gated container with gated children, claimed by a workspace of
  its own, opened cold at a child's address while the session arrives late, both while the
  application is already drawn and while it waits for the session. Two testbed switches make that
  reproducible: a session that arrives after a delay, with the identity behind the stored state
  following it, and the claiming workspace.

No new call, option or type.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The requirements named under *Why* already promise the behaviour; the change makes the
implementation keep them and pins the case that broke.

## Impact

- `platform/libs/core/shell/src/lib/regions/pane/container/container-pane-host.ts`: the container
  lays out its children again when its inner arrangement is gone.
- `platform/libs/core/shell/src/lib/regions/pane/container/a-container-outlives-its-arrangement.spec.ts`:
  the regression test in the merge gate.
- `platform/libs/weavers/testbed-weaver/src/lib/containers/register-containers.ts` and its
  translation bundles: the gated container, its gated children and its overview.
- `platform/apps/loom-testbed/src/main.ts`, `platform/apps/loom-testbed/src/app/e2e-switches.ts`,
  `platform/apps/loom-testbed/src/app/testbed-workspaces.ts`: the late session and the claiming
  workspace as testbed switches.
- `platform/apps/loom-testbed-e2e/src/gated-container-cold-start.spec.ts`: the browser case, in the
  nightly suite.
- `platform/tools/checks/bundle-size-baseline.json`: the testbed's ceiling moves from 905 to 910 kB
  for the gated container and the switches.
- NextPA findings **F-042** and, for containers, **F-032**. Once a release carries this, NextPA's
  branch `fix/adopt-loomweaver-0-14-4` can keep `access` on the assistant's container.
- Behaviour change without an API change, and only toward what the contract already says. The same
  re-layout also covers a workspace reset or any other replacement that leaves an open container
  without its inner arrangement.
