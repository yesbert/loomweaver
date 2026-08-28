## Context

See proposal.md — Why. What shapes the approach is where the two behaviours part, because they part
cleanly and that is the useful fact.

Hidden **within** a workspace, retention already works: the surface is left standing where it is,
drawn or not drawn, and comes back untouched. Hidden **by a workspace switch**, it does not: the
arrangement of the outgoing workspace is put away and the incoming one is laid out, and what the
outgoing one was keeping is not carried across that. So the mechanism exists and is correct; what is
missing is that a workspace switch reaches it at all.

Two properties decide how much room the fix has.

1. **A kept surface belongs to the pane showing it.** That is a guarantee of its own — a change of
   focus never orphans what a pane was keeping, and a split shows two independent instances. So what
   must survive a switch is not a surface but a pane's holding, and the unit to carry across is
   whatever the outgoing arrangement was keeping.
2. **Moving a rendered frame reloads it.** The browser gives no way to relocate an `<iframe>` in the
   document without restarting it, which is why the contract already says an isolated surface is
   hidden in place rather than moved. A workspace switch that rebuilds the content area and remounts
   the kept surfaces into it would therefore still reload every frame, and would satisfy a component
   surface while quietly failing the very case that found this.

## Goals / Non-Goals

**Goals:**

- A workspace switch parks what the outgoing arrangement was keeping and finds it again on return.
- An isolated surface is parked without being reloaded and without a repeated handshake, which is the
  case a component-only fix would miss.
- The case is pinned by a test at both rungs, so it cannot be lost again to a reading of "hidden".

**Non-Goals:**

- **Keeping anything that did not ask to be kept.** The default stays destruction. A switch is not a
  reason to grow memory with every surface the user ever visited.
- **Surviving a reload of the application.** What is parked lives as long as the window does. State
  that must outlive the window has its own seam, and it is unaffected by this.
- **Changing what a declaration can say.** No new value, no new field, no published type touched.
- **Making the arrangement itself survive differently.** Which panes a workspace has, and what they
  hold, is already stored and restored; only what a pane was keeping alive is at issue.

## Decisions

### The parked holding is keyed by workspace, not thrown away with the arrangement

What a pane keeps is put aside under the workspace being left and taken up again when that workspace
is chosen. A workspace the user never returns to keeps holding what it held, which is the same trade
the retention default already makes for a hidden surface within a workspace.

*Why not keep everything alive in one flat store* — because the pane is the owner of a holding, and
two workspaces may each have a pane showing the same surface. Flattening them makes one instance two
workspaces share, which contradicts the guarantee that a split shows two independent instances.

*Why not rebuild from stored state instead* — that is the answer for a surface that must survive
being rebuilt, and it is already available to anyone who wants it. It is not an answer for a surface
that asked not to be rebuilt, and it cannot be one for a frame, whose handshake and channel are not
state a surface can write down.

### The frame is parked where it stands, not moved

An isolated surface parked by a switch stays in the document and stops being shown, the same
treatment it already gets when it is hidden within a workspace. That is what keeps it from
reloading, and it is why the fix cannot be "remount the kept surfaces into the new arrangement".

The consequence is that a parked frame keeps occupying a place in the document while another
workspace is on screen. That is acceptable for something the surface explicitly asked for, and it is
bounded by the same declaration.

### The test names the rung it verifies

Two cases, not one: a component surface parked and found with its work intact, and an isolated
surface parked and found on the same channel. The second is the one that fails today for a reason
the first cannot show, and a suite that only covers the first would go green over the defect.

## Risks / Trade-offs

- **A parked frame is a frame that is still there.** → It is what the declaration asked for, and it
  is the same cost already paid within a workspace. A surface that does not ask keeps being
  destroyed.
- **Memory grows with the number of workspaces holding kept surfaces.** → Bounded by declarations
  rather than by use: only surfaces that ask are parked, and a product that wants none declares none.
- **The fix could be written so that only component surfaces pass.** → The design names that outcome
  as the likely wrong turn, and the frame case is a separate scenario in the contract rather than an
  afterthought in the same one.
- **Parking hidden elements can disturb layout or focus.** → The same in-place hiding is already used
  within a workspace, so the behaviour is not new; what is new is when it applies.

## Migration Plan

Nothing to migrate. No declaration changes meaning, no published type changes, and a product that
never declared a kept surface sees no difference. The behaviour only becomes what its declaration
already promised.
