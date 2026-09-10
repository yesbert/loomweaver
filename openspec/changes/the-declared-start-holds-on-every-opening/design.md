## Context

See proposal.md — Why. The mechanics behind it, because they explain the shape of the fix: the
service that owns the active workspace *adopts* a declared start exactly once, when nothing is
stored yet, and hands that adoption to the workspace service, which lays the workspace out and then —
only if the address named no content — navigates to the workspace's own active tab. On every later
opening the stored workspace is restored rather than adopted, the adoption is empty, and the whole
block including the navigation is skipped.

Two properties of the surroundings shape the fix. A workspace's arrangement is stored per workspace,
so the arrangement of the declared start is readable at boot whether or not it is the workspace that
was last active. And where a distribution's working state cannot be read back synchronously, the
arrangement is not there yet at the moment the active workspace becomes known: it arrives one
asynchronous step later, with a retry behind it.

## Goals / Non-Goals

**Goals:**

- One rule for what an opening at an address that names no content does, whether it is the first or
  the thousandth.
- The declared start is reached with what the user left in it, which means reading that workspace's
  stored arrangement rather than its declaration.

**Non-Goals:**

- No rule for navigating to the bare address *inside* a running application. What a distribution
  serves there stays reachable; this change is about opening the application.
- No new surface. A distribution that wants a different destination declares a route of its own,
  which is the neighbouring change `a-distributions-own-routes-survive-the-boot`.
- Not the arrangement of a workspace nobody opens. Restoring the last active workspace's arrangement
  is unchanged; it simply stops deciding the address.

## Decisions

**The opening step is decided by the declaration, not by what was last active.** At an address that
names no content, the workbench goes to the declared start. The alternative — go to the workspace
the user last used — was considered and rejected by the owner: an address that always leads to the
same place is easier to reason about than one whose destination depends on invisible stored state,
and it is the behaviour our first-party product already implements by hand.

**Reaching it uses the same path a switch uses.** A switch already reads a workspace's stored state,
falls back to its baseline where there is none, hydrates it, and chooses the address from the
arrangement's active content. The opening step is that same path, with two differences: it also runs
when the declared workspace is already the active one, and it replaces the history entry instead of
adding one. Reusing it keeps one description of what entering a workspace means.

**Where the declared workspace is already active, the step waits for the arrangement.** With a store
that reads back synchronously the arrangement is there at once; with one that does not, the address
would be chosen from an empty tree and the step would navigate nowhere. The step therefore waits for
the arrangement to have settled before it chooses. The retry that the arrangement's own loading
carries is what bounds that wait.

**A late navigation never overrules the user.** The address the application was opened at is frozen
at start-up, so it says nothing about where the user is once an asynchronous load has finished. The
step therefore checks that the address still names no content at the moment it acts, and does
nothing if it does not.

**Nothing happens where the declaration holds no content.** The workbench has no address to go to,
and the existing requirement that such a workspace shows what the bare address shows stays exactly
as it was. This is what keeps our own demo, whose starting workspace declares no content and whose
bare address carries a chromeless surface, behaving as it does today.

**Replacing rather than pushing.** The address that named no content is not a place the user chose,
and leaving it in the history makes going back return to a screen the workbench has just decided is
not the destination. Replacing also brings the first visit into line: today it pushes.

## Risks / Trade-offs

- **A returning user who last worked in another workspace now starts in the declared one.** That is
  the point of the change and the owner's decision, but it is a visible difference for anyone who
  relied on the old sentence. → Stated in the spec delta as a removal with a migration note; the
  workspace they left keeps everything they left in it, one switch away.
- **A distribution whose identity-scoped storage is not known at boot.** The stored arrangement of
  the declared start is invisible until the session is known, so an opening can land on the
  declaration rather than on what was left. → Unchanged by this change: a distribution in that
  position already reloads on an identity change, and the opening step then runs again.
- **The declared start cannot work as declared.** → Unchanged: the user is left in it and told, and
  the existing reset offer repairs it. The opening step finds no content to go to and leaves the
  address alone.
- **Two navigations at boot if a deep link and the step disagree.** → They cannot: the step only
  acts where the address names no content, and re-checks before it acts.
