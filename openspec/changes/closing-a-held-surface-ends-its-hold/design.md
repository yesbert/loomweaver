## Context

The view mount service creates one injector per view instance and keeps it for the life of the
application, because the view state it carries has to outlive a rebuilt component. The hold is
provided from the same injector, so it outlives the component too. The retention stash destroys a
closed instance's view and stops listening to its hold, and leaves the hold switched on.

The panel width check compares the start width with the bounds and the bounds with each other. Every
comparison with a value that is not a number is false, so such a value is never refused.

## Goals / Non-Goals

**Goals:**

- A closed view that is opened again is placed, whatever its predecessor held.
- Every width a panel region declares is refused at composition when it is not a positive number.

**Non-Goals:**

- Giving each component its own injector. The view state must stay per instance.

## Decisions

- **The stash ends the hold when it destroys the last entry holding it.** The stash is where an
  instance is ended, whichever path ends it: closing, evicting, sweeping or a failed reclaim. Ending
  it there covers all of them. Ending it through the ordinary release keeps one path for turning a
  hold off. An entry still in the stash that shares the hold keeps it, so destroying a transient
  second copy of an instance cannot release the hold of the one on screen.
- **One loop over the four declared widths.** The overlay width already had the check; the start,
  narrowest and widest widths join it, with the same message, before the bounds are compared.

## Risks / Trade-offs

- A product that relied on a hold surviving a close would lose it. The contract says closing ends the
  instance, and the new component is a different one, so nothing can rely on that.
