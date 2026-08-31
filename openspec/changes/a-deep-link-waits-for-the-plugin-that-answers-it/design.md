## Context

See proposal.md for motivation. What matters here is that the mechanism the requirement asks for
already exists and is only half wired.

The content router remembers the address the application booted at, applies the route table as it
stands, runs the initial navigation, and retries the remembered address whenever the registry
publishes a new route table. The retry works: once the plugin registers, the address is honoured.

Two things around it do not.

The initial navigation is run against a route table that is **known** to be incomplete, because the
boot address was just recorded as pending for exactly that reason. Angular finds no route and
reports the address as unreachable.

The failure is then allowed to change persisted state. The workspace that claims the address is
frequently already the active one, because the active workspace is restored from the previous
session. The starting address is added as a tab of that active workspace, becomes its active tab,
and is saved with its arrangement. When the plugin registers a moment later the retry succeeds and
the screen looks correct, so nothing signals that anything was written.

The saved arrangement is the lasting damage. Every later switch into that workspace restores the
starting address as the active tab, navigates there, and the starting workspace claims it, so the
workbench settles away from the workspace the user asked for.

The trigger was reproduced in full: leave the session in the claiming workspace, cold start at its
address with the plugin entry held back, and the saved arrangement comes out matching a real user
profile byte for byte, including both tabs being non-closable.

## Goals / Non-Goals

**Goals:**

- The initial navigation of a pending address succeeds quietly, so nothing is reported as
  unreachable while the answer is still on its way.
- Content the workbench chose because it could not show the address never enters a workspace's
  remembered arrangement.
- Both halves are pinned by tests that fail against today's code.

**Non-Goals:**

- Making a plugin register faster, or introducing any notion of waiting for all plugins to be ready.
  A plugin may never register at all, so no such signal can be relied on.
- Repairing profiles already damaged. Resetting the workspace restores its declared arrangement,
  which the workspaces capability already guarantees.
- Changing what the user *sees* while an address is pending. This change is about what is reported
  and what is remembered.

## Decisions

**A pending address gets something to land on, rather than the navigation being delayed.**

While an address is pending, the route table carries a placeholder for it, so the initial navigation
matches and completes. When the real route arrives the placeholder gives way and the existing retry
brings the content in.

This mirrors a shape the router already has: a route whose plugin is present but withheld is served
by a placeholder today, so a second kind of placeholder is a variation on an established pattern
rather than a new mechanism.

*Alternative rejected — delay the initial navigation until plugins have registered.* There is no
honest signal for "all plugins have registered", and a plugin that fails to activate would hold the
application on a blank screen forever. It also trades a visible defect for an invisible one.

*Alternative rejected — catch and swallow the routing error.* It silences the symptom, leaves the
persisted damage entirely untouched, and would also silence a genuine typo in an address, which is
the one case where reporting it is right.

**Fallback content is refused entry to the arrangement, at the point where a navigation becomes a
tab.**

The workbench decides what to show when an address cannot be answered. That decision is a display
decision. It becomes damage only when it is recorded as though the user or the product had put it
there, so the fix belongs where a navigation turns into a tab of the active workspace, and it is
carried by knowing that this navigation is the workbench's own fallback rather than a destination
anybody asked for.

*Alternative rejected — filter at the point the arrangement is saved.* The stray tab would still
appear during the session, the user could still act on it, and any second path that writes an
arrangement would need the same filter. Refusing it at the door is one place instead of many.

**The requirement is not rewritten, only extended.**

The guarantee that a deep link survives arriving early is already stated and already correct. The
delta adds what the workbench must not leave behind, states the limit of that guarantee next to it
(what is remembered, not what is displayed), and otherwise leaves the requirement's text alone.

## Risks / Trade-offs

- **A placeholder that is never replaced leaves the user looking at nothing.** → The placeholder
  shows the same unavailable state the router already shows for a withheld route, so an address that
  is never answered reads as unavailable rather than as a blank screen, and the existing rule that a
  pending address is abandoned once the user moves on continues to apply.

- **A placeholder route could shadow a real one registered under the same address.** → The
  placeholder exists only while the address is pending and gives way when the route table changes,
  which is the same moment the retry runs. A test pins that the real content wins.

- **Refusing fallback content entry to the arrangement could also refuse something legitimate.** →
  The refusal is tied to the workbench's own fallback navigation, not to the address it lands on, so
  a user who later navigates to the starting address themselves still gets a tab for it.

- **The damage is invisible once the retry succeeds**, which is why it went unnoticed. → The test
  for the second half asserts against the saved arrangement rather than against the screen, because
  the screen looks right in the broken case.

## Migration Plan

None. No published type changes, no stored format changes, nothing for a consuming product to do
beyond upgrading. A profile damaged by the old behaviour is repaired by resetting the affected
workspace.

## Open Questions

- ~~Whether the same hole exists on the pop-out window path.~~ **Answered while implementing: it does
  not.** A pop-out address is served by a wildcard route the workbench registers unconditionally and
  first, so the router always matches it and can never report it as unreachable. Which surface is
  shown is then resolved by the pane from the registry rather than by the router, and that path
  already re-mounts when a plugin registers after the pane, with a test that says so. Nothing to fix
  in a second place.
