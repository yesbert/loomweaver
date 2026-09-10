## Context

See proposal.md, *Why*. What shapes the approach, all of it found by reading the code and the
contract rather than assumed:

- **The rule already exists twice, in private.** Answering *does this address hold unsaved work* is
  what the close guard does before it raises its dialog, and two places compute it separately: the
  pane's own close path and the content area's. Both gather the surface instance at the address and
  the instances of an arrangement's children, then ask each whether it is dirty. This change needs
  the same answer for two more callers, which is the moment to have one rule instead of three.
- **There is one tab strip component, used in three places**: the content area, a pane, and the
  sidebar header. A guarantee about tabs therefore costs the same whether it names one kind of tab
  or all of them, and naming only content tabs would cost *more*, because the demo's own case is a
  child of an arrangement, which is not a content tab.
- **An invariant makes the reading cheap.** `surface-retention` already guarantees that a surface
  holding unsaved work is never destroyed. So absence of a live surface is a sound answer of *no
  unsaved work*, and nothing has to be remembered on the side, reconciled or cleaned up.
- **Dirtiness is already reactive by contract.** A surface is required to read its own signals inside
  its report, because the workbench reads that report reactively. A reader that wraps it therefore
  follows a change from unsaved to saved without any notification mechanism.
- **The distribution side needs no new rule.** `host-services` already requires that a workbench
  fact a distribution may read is exposed as reactive state. This adds a fact under an existing rule.
- **The plugin side has a precedent for needing no grant.** A plugin needs no granted capability to
  run a command it registered itself. Reading whether its own surface is unsaved is the same shape of
  question about the same kind of thing.

## Goals / Non-Goals

**Goals:**

- One rule from an address to *has unsaved work*, with the four callers reading it: the close guard,
  the tab strip, the distribution's fact and the plugin's read.
- A mark that survives an accessibility audit, not only a visual one.
- A read surface narrow enough that no plugin learns what another is editing.

**Non-Goals:**

- No change to what a surface reports, and no new way to report it.
- No way to *act* from the new read: nothing here saves, closes or asks on a product's behalf. Those
  exist already, and mixing a read surface with a write surface is how a small API stops being small.
- No indication anywhere except a tab. A count on a rail entry, a badge on a collapsed sidebar and a
  mark in a window of its own are all things a product can now build, and none is guaranteed here.
- No attempt to close the pop-out gap. A pop-out carries no tab and closes without the question
  today; both are true before this change and stay true after it. Naming it is the whole treatment.

## Decisions

**The strip asks; the tab is not told.** A tab is a plain description built independently by each of
the three call sites, so adding a field to it would put the aggregation rule in three builders and
leave three chances to forget the arrangement case. The strip instead resolves the state itself, for
the address each tab carries. The alternative, a flag on the description, is simpler to read and
worse to maintain, and the drift it invites is exactly the drift this change is trying to end.

**Read the version, or the reading never wakes up.** The instance store keeps a signal that counts
its own changes, but the methods that hand out instances do not read it. A reader that only walks the
instances tracks each surface's own signals and therefore notices dirty becoming clean, while never
noticing a tab that was opened or closed. That failure is silent and looks like a caching bug months
later. Every reader here takes the version first, deliberately.

**The plugin reads about its own surfaces only, and needs no grant.** Bounding it this way answers
the motivating case completely, because a list marking its own documents is asking about surfaces its
own plugin registered. It also removes the question of whether the answer leaks: there is nothing to
leak. The alternative, a granted capability over every address, is a larger surface for no case we
have. A sandboxed plugin is outside this: it reports its own state over its channel and is told about
its own surface there, and nothing of this shape crosses that boundary.

**The distribution reads a fact, not a service of its own.** It joins the facts already readable
under the existing rule, which is why the proposal declares no delta on `host-services`.

**The mark shares the slot the close control uses.** A tab carries a control on its trailing edge
when it is closable, so a mark that takes that place costs no width and adds no element, and the
control appears when the pointer reaches that place.

The first attempt tied the swap to the whole tab, and looking at it in the demo showed why that is
wrong: clicking a tab leaves the pointer on it, so the tab a user has just switched to is exactly
the one whose mark is hidden. The swap is therefore local to the slot the two share. Pointing at a
tab, or switching to it, never hides its mark; only moving onto the trailing control does, which is
already a move toward closing.

**A pinned tab carries the mark beside its title, and keeps its pin.** The three shapes named as an
open question were drawn against the demo and looked at in both themes. Replacing the pin while the
work is unsaved costs no width but hides a state the user set: the tab reads as unpinned for as long
as it is dirty. Putting the mark on the leading edge is loud, but it shifts the title and leaves
pinned tabs aligned differently from every other tab in the strip. Beside the title the tab grows by
four pixels, both states stay readable, and the mark sits where the eye already looks for it on the
tabs next to it. The pictures are beside this note rather than in it, because none of them is a
guarantee: the requirement asks for a tab that is distinguishable, not for a glyph.

**The accessible name carries the state.** The mark is drawn, and the tab's name says it as well. The
contract requires it, and a name that says it also survives a user who has turned the drawing down.

## Risks / Trade-offs

**Cost grows with tabs times instances.** Each tab resolves its state by walking the instance store.
With the handful of tabs and surfaces a workbench holds this is nothing, and the reading only
re-runs when the store changes or a surface's own signals do. → Measure before optimising; do not
build an index for a list this short.

**A surface whose report throws is treated as unsaved.** That is the close guard's existing choice,
made so that an error can never discard work. Carried into a mark, a broken plugin shows a tab that
never comes clean. → Keep the choice, because the alternative is losing work, and let the console
error that already accompanies it be the diagnosis.

**Two indications could disagree.** If the tab and the readable fact ever resolved differently, the
product would contradict the workbench in the same window. → One rule, four callers. This is the
whole reason the rule is extracted rather than copied a third time.

**The mark competes with two existing controls.** → The close control gives up its slot and returns
on hover; the pin keeps its own and the mark stands beside the title.

**The reasoning behind the mark's shape must not enter the repository.** The project does not name
other products in its documentation, and describes a capability rather than deriving it. → The guide
says what a user sees and what a product may read. Where this note needed the comparison to think, it
stays in this note.
