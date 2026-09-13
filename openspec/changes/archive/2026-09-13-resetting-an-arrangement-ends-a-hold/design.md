## Context

- **A reset of the active workspace applies state, it destroys nothing directly.** The workspace
  service confirms against unsaved work, then hydrates every workspace key with the baseline. The
  pane tree's hydration only moves kept in-place surfaces into the holding area, and skips held ones.
- **Surfaces end afterwards, through the retention collector**, which evicts a closed tab and a
  hidden, clean, unkept surface. A held surface is exempt from the second rule.
- **Resetting a workspace the user is not in** evicts that workspace's parked instances directly,
  and destroying an entry ends its hold since the previous change.
- **Every stash entry records the workspace it was acquired in**, and carries the hold state of its
  instance when it has one.

## Goals / Non-Goals

**Goals:**

- After a reset of the active workspace, no surface acquired in that workspace is still held.
- A formerly held surface ends up exactly where a surface that never held would.

**Non-Goals:**

- Destroying a held surface outright on reset. A surface the baseline still shows in the same place
  is not rebuilt when it never held, so it is not rebuilt when it did.
- Moving a held view, which is the next change.

## Decisions

- **Release the holds, then apply the baseline.** Ending the hold goes through the ordinary release,
  so the stash applies what it deferred and the retained component puts a surface still in use back
  in its place. Applying the baseline afterwards hides or closes what the baseline no longer shows,
  and the collector ends it. That is "as it ends any other" without a second path for ending.
- **The stash ends the holds of one workspace.** It owns the entries and knows which workspace each
  was acquired in. The workspace service calls it for the active workspace only; a workspace the user
  is not in is already covered by evicting its parked instances.

## Risks / Trade-offs

- A product that keeps its window open after the hold reads off would show an empty window. Reading
  the hold is how it learns, and the guide says so.
- The stash is at its file size ceiling. The method has to fit, or a helper moves out beside the
  entry model.
