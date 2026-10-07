## Context

`IdentityChangeReload` watches the session's subject and calls `location.reload()` when an
established subject is replaced by a different one. The application's start under its base is
already known to the shell as `ServedBase.path`, which the translation loader and the pop-out
windows use since 0.14.5. A pop-out window is recognised by its path, and runs the same providers as
the main window, so it reloads too. See proposal.md for the failure.

## Goals / Non-Goals

**Goals:**

- The reload lands where opening the application would.
- A pop-out window does not turn into a second workbench, and does not show the previous person's
  surface.

**Non-Goals:**

- A choice of landing. See the decision below.
- Changing when the policy fires. The trigger stays exactly as it is; the requirement only writes it
  down.

## Decisions

**`location.replace(base)` rather than `reload()`, and no option.** Replacing keeps the previous
person's address out of the history, so Back does not return to it. The finding offered an option
(`reload: 'start' | 'here'`) or a callback for the target. Neither is taken: no case is known in
which a different person wants the previous person's address, and a product that wants a specific
landing already has one, through its own route for the bare address or the declared start
workspace, both of which a fresh opening honours. Adding a choice later is additive; removing one
is not.

**The landing is the base, not the distribution's default route.** Opening at the base runs the same
path a person opening the application takes, so the workspace start, a product's own route for the
bare address and the new person's stored arrangement all answer as they would at any opening. Naming
a route here would be a second definition of where the application starts.

**A pop-out window closes.** It was opened by script, so `window.close()` is allowed. Where it is
refused (a window restored by the browser after a restart), the window falls back to opening the
application at its start, which is still clean.

## Risks / Trade-offs

- [A product relied on the reload keeping the address] → No product is known to; the guide never
  said where it lands, and the case it served, the same person again, does not reload at all.
- [The two windows of one person both reload at the start] → Each lands in its own stored
  arrangement, since layout keys are per window.
