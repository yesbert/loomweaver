## Context

See `proposal.md` — Why. What the investigation on 2026-09-11 established, so that the work does not
start by repeating it:

- The address used throughout is the testbed's `/arranged/alpha`, whose container holds four panes.
  One of them is gated on the `admin` role, and the testbed cycles principals with a rail button.
- **A plain reload changes nothing.** Reloading without changing identity keeps all four panes and
  keeps the placeholder. So the collapse is not the reload.
- **Every identity loaded fresh is correct.** Signed out, a user without the role, an admin, and a
  second user all render four panes with the right placeholder or the content. So the gating and the
  declared arrangement are both sound.
- **Only the adoption is wrong.** Between the identity being adopted and the next navigation, the
  container shows one pane and the gated pane shows no placeholder at all.
- **Nothing wrong is written down.** After the adoption both `lw.shell.pane-trees:default` and
  `lw.id.ada:lw.shell.pane-trees:default` exist, and opening the address again reads four panes back.

The testbed composes `provideAuthSource(..., { onIdentityChange: 'reload' })` and
`provideIdentityScopedStores({ identity: () => subject })`, so an identity change reloads the
application and the stores move to the adopted namespace. Both are ordinary compositions a product
would make, which is why the defect is worth fixing rather than working around in the testbed.

## Goals / Non-Goals

**Goals:**

- The arrangement survives the adoption, with no window in which it is wrong.
- The gated pane's explanation is continuous: it says one true thing before the adoption and one
  true thing after it, and nothing in between.
- The end-to-end suite ends green, so that a red run means something new.

**Non-Goals:**

- No change to what the platform guarantees. Both behaviours are already required.
- No change to how a product composes an auth source or identity-scoped stores. The composition in
  the testbed is the ordinary one and must keep working unchanged.
- No rework of the gating itself, which the investigation showed to be sound.

## Decisions

**Pin it before fixing it.** The first task is a failing test, not a diagnosis. The existing
end-to-end test fails for this reason but says only that a placeholder is missing; it does not say
the arrangement collapsed, which is the larger fact and the one that would regress silently. A test
that names the arrangement comes first.

**Pin it in the unit suite, in the harness that already renders content.** The merge gate is the
right home, and the adoption is reachable there: `adopting-a-namespace.spec.ts` boots the workbench
through the router harness, so a container route really mounts and really builds its pane tree. A
first attempt at a harness of my own said the opposite, because nothing was rendered in it: with no
content region the pane tree is empty, the empty tree is written over the store at boot, and every
assertion about an arrangement is then true of nothing. That is a property of that harness, not of
the suite.

**The cause, recorded because the search went the long way round.** At the moment of adoption the
workbench re-read every workspace key and fell back to the workspace baseline wherever the adopted
namespace answered with nothing. A container's pane tree is built at runtime by the container host
and appears in no baseline, so the fallback did not restore it, it erased it: the dock left the pane
tree, `PaneTreeService.tree` answered with the default single leaf, and the host does not rebuild,
because `ensureContainer` runs once in its constructor. Hence one empty pane where four had been, and
no gated child left to show a placeholder. Nothing wrong was written down because the held writes
land in the adopted namespace immediately afterwards, which is also why the next navigation repairs
it.

Two things this is **not**, both measured: re-reading a key the adopted namespace does hold is
correct and stays correct, and the gating is sound. The fallback to baseline is the whole defect.

**Fix it where the requirement already says what should happen.** `persistence-ports` states that
where the adopted namespace holds nothing for a key, what the workbench holds stands. So the adoption
path hydrates only the keys the adopted namespace answers for and leaves the rest alone. The baseline
fallback stays where it belongs, on entering a workspace.

**Correct the stale test rather than delete it.** The address that names no content is still worth a
test; what it should assert changed. Deleting it would quietly reduce what guards the workspaces
contract, and the next person would have no way to know that the case was once covered.

**Read the rest of that file.** One test encoding superseded behaviour suggests others might. The
file gets read through before the change closes, rather than waiting for the next red run to find
them one at a time.

## Risks / Trade-offs

- **The cause may sit in composition rather than in the platform.** If it turns out that the
  arrangement is lost because of how the testbed composes rather than what the platform does, the
  finding changes from a defect to a documentation gap. → Then this change says so and fixes the
  guidance instead; the requirement quoted in the proposal still decides which of the two it is.
- **A fix at the adoption path touches state restoration, which is load-bearing.** → The existing
  tests around adoption and around the pane tree are the guard; they run before and after.
- **The window is brief and the repair automatic**, which is exactly why it survived this long. →
  The pinning test asserts the state immediately after the adoption, not after a settling navigation.
