> **Status:** proposed — not approved for implementation yet.

## Why

A distribution can switch a workbench gesture off, and the switch is thorough: the button, the menu
entry, the drop target and the shortcut all go. Two things go with them that should not. The
distribution's own code loses the capability too, because the switch is read as "no route remains"
rather than "no route the user can take", and the switch is fixed at boot, read once into every place
that honours it.

That defeats the reason a product switches something off in the first place. A product that finds
our tab controls wrong for its users wants to hide them and offer the same actions from its own
toolbar, its own menu, its own keyboard layer. A product that lets an administrator or a power user
shape the workbench wants to flip a switch while the application runs. Neither is possible today: the
first because switching off removes the code path along with the control, the second because nothing
after boot reads the switch again.

This is the first slice of a distribution-facing workbench API. It settles the meaning of a switch,
states what a distribution may rely on when it drives the workbench it composed, and makes the
switches live. Later slices add the programmatic twins for panes, sidebars and workspaces on the
ground this one lays.

## What Changes

- **A switch removes the user's routes, not the capability.** `gesture-configuration` is sharpened
  so that switching a capability off takes away every route the user can take and leaves the
  capability reachable to the distribution's own code. What the distribution switched off, it may
  still do, and offer again in its own place and shape.
- **Switches change at runtime.** The declaration a distribution makes when it composes the
  application becomes the starting value. The distribution can read the current value of every
  switch and change switches while the application runs, naming only what changes, in the same shape
  the declaration uses. The controls, menu entries, drop targets and shortcuts that honour a switch
  follow it live.
- **Switching off acts forward only.** Turning a capability off removes the routes to it from that
  moment on and never undoes what the user built with it: a split stays split, a pop-out stays
  open, a collapsed sidebar stays collapsed.
- **The workbench does not remember a switch.** A switch holds for the running session and starts
  from the declaration on the next start. Whether a change made at runtime survives, and for whom,
  is the distribution's decision, made with the persistence ports it already has.
- **A new capability, `host-services`,** states what a distribution may rely on when it drives the
  workbench through the services it injects: that the services are published and documented, that
  the service behind a control is the same one the control calls, that workbench facts are readable
  as reactive state, and that the current value of every switch is one of those facts. It also draws
  the boundary: this surface is the distribution's, and a plugin reaches the workbench through its
  own context.
- The distribution guide and the host-services reference describe the live switches and the new
  reading side. The exported names this adds are documented, as the published-contract check
  requires.

No breaking change. `provideShellFeatures` keeps its signature and its meaning as the declaration;
what changes is that the declaration is a starting value rather than a constant.

## Capabilities

### New Capabilities

- `host-services`: what a distribution may rely on when driving the workbench it composed through
  the services it injects. Published and documented surface, the same code as the controls, facts as
  reactive state, the current switch values among them, and the boundary to plugins.

### Modified Capabilities

- `gesture-configuration`: *A switch takes the affordance and the gesture together* is restated so
  that the routes a switch removes are the user's routes, and the capability stays reachable to the
  distribution. *Everything is on unless the product says otherwise* is restated so that the
  declaration is the starting value of a switch that can change at runtime. New requirements state
  that a switch can be changed and read while the application runs, that the affordances follow it
  live, that switching off acts forward only, and that the workbench does not remember a switch.

## Impact

**Shell.** The switch set is held today as a constant provided once and read once into fields at
about seventeen places across fifteen files: the content area and its tab strips, the pane view and
its drop zones, the sidebar header and panel, the rail, the curation dialog, the command service, the
keybinding service and the command palette, the composition report, and the seeding of built-in
commands and menus in the composition root. Every one of those places changes from reading a value
to reading a signal. The seeding of built-in commands and menu entries is conditional on switches at
boot and has to follow them live instead. The switch set gains a small service that holds the
current values, exposes them as signals and accepts partial updates in the shape the declaration
already uses.

**Published contract.** `@loomweaver/shell` exports the new service. Every added name must appear in
the consumer documentation before the published-contract check passes.

**Documentation.** `docs/building-a-distribution.md`, section *Switching capabilities off*, gains
the runtime side and the forward-only rule. `docs/reference/host-services.md` gains a section for the
switches and states the guarantees of the new capability in a reader's terms.

**Specifications.** A delta on `gesture-configuration` and a new `host-services` capability.

**Legacy sources dissolved.** None. The rules this change specifies were written down on
2026-09-03 in `CONTRIBUTING.md`, section *Shaping the surface*, and in `openspec/config.yaml`; this
change makes the ones that are guarantees into requirements and leaves the ones that are working
rules where they are.
