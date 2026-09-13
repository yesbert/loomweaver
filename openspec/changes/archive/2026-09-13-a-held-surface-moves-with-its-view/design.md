## Context

Established by reading the code and by a browser probe on 2026-09-13:

- **A docked view is kept in the stash under its place**: the panel region, the pane and the view
  path, plus the instance. Moving the view changes the place and therefore the key.
- **The hold belongs to the view instance**, provided from the per-instance injector, so every
  component built for that instance shares one hold state.
- **The retained component acquires by key.** Finding no entry under the new key, the stash builds a
  new component. Sharing a held hold, the new component is never placed.
- **The retention collector evicts an entry whose tab is not open in its own pane**, before the rule
  that spares a held surface. After a move the old pane no longer has the tab, so the running instance
  is destroyed.
- **Releasing a hold settles the entry**, and the retained component then repairs the placement of
  an entry it owns by moving its nodes before its own anchor.

## Goals / Non-Goals

**Goals:**

- A held instance survives its view being moved between panels or panes, and stays where the product
  put it.
- The place the view arrives at owns that instance, so releasing the hold places it there.
- A held surface whose view is closed is ended as before.

**Non-Goals:**

- Carrying an unheld surface's live instance across a move. It is rebuilt with its view state, as
  today.
- Treating a second, separate showing of the view as a move.

## Decisions

- **The arriving place adopts the held entry once the old place has let go of it.** When the stash
  finds no entry under the key it is asked for, and the component to acquire carries a hold that is
  on, it looks for an entry not in use holding that same hold state and moves it to the new key
  instead of building a component. Matching on the hold state rather than on the view path keeps it
  exact: only the instance that is actually held moves.
- **Until then the arriving place waits and builds nothing.** Panels refresh in document order, so
  moving from right to left acquires before the old place releases. Taking over an entry still in use
  was considered and rejected: the old place's slot goes stale, its reconciliation acquires again and
  would take the entry back, and the two places would trade it forever. Waiting instead, the
  arriving place tries again when the stash changes, which the old place's release causes.
- **The retained component reads the hold before anything is built.** Today the hold reaches the
  stash with the created component. The component has it from the injector already, so it can ask
  whether the held instance is in use elsewhere, wait if so, and hand the hold to acquiring otherwise.
- **The collector asks whether a held surface's view is open anywhere.** For an entry that is held,
  the closed-tab rule looks for its view path in every pane instead of only in its own. That covers
  the moment between the tab leaving and the new place adopting, whichever runs first.
- **Releasing needs nothing new.** The adopted entry is owned by the new place, so the existing
  repair puts its nodes before the new anchor once the hold is off.

## Risks / Trade-offs

- Two places could ask for the same held instance at once, for example the same view stacked twice.
  The last to acquire owns it and the other gets a new component, which is held and not placed.
  That is today's behaviour for that case and is not made worse.
- The stash is at its size ceiling. Adoption goes beside the entry model, as the last-holder check did.
