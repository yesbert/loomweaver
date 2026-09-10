## Context

See proposal.md — Why, for the measurements. What the code does today, in the order it does it:

The scoped stores share one latch that holds the first non-empty identity a product answers with.
Until then every key passes through unscoped, so the workbench reads the anonymous namespace, and
where a product's session is answered by its server the first paint always happens there. The
workbench takes an empty read for a first visit, applies what the distribution declares, and stores
that. When the session lands the latch closes on the subject, every later read and write is scoped,
and nothing tells the workbench that the ground moved. The next write puts the declared arrangement
into the person's namespace, on top of what was theirs.

Two mechanisms already exist and are worth reusing rather than duplicating. The cross-tab sync
service re-reads a registered key through the port when it changed elsewhere, which is exactly the
shape an adoption needs. And the router already keeps the address the application was opened with,
to complete an opening once a late plugin makes it reachable.

## Goals / Non-Goals

**Goals:**

- No path where state stored for a person is replaced by state built before that person was known.
- The adoption is a moment the workbench can see, rather than something that silently happens
  inside a key prefix.
- One guard for "the user has moved", used by every re-navigation the workbench does on its own.

**Non-Goals:**

- Removing the flash. A product whose identity is answerable only after a round trip will still show
  the declared arrangement first and the person's arrangement a moment later. Only the product can
  close that, by answering the identity at the first read, and the contract already asks it to.
- Reviving arrangements already overwritten. There is no copy to restore from.
- Changing when a namespace is adopted. The rule that a mid-session change of person takes effect
  across a reload, and that the first sign-in of an anonymous session adopts directly, stays as it
  is.

## Decisions

**The latch announces the adoption.** The shared latch gains a way to be watched, and the moment it
closes on an identity is the signal both halves of this change hang on. The alternative — polling the
identity from the shell — was rejected: the shell would have to know the product's session, which is
precisely what the ports exist to avoid.

**The re-read goes through the channels that already exist.** On adoption, every key registered for
cross-tab sync is read again through its port and applied. State that the workbench restores at boot
without registering such a channel gets one; that gap is the same gap that leaves it out of a
cross-window update today, so closing it pays twice.

**Writes are held from the adoption until the re-read has landed, and what they carried is dropped.**
Holding is not enough on its own: a write queued during the window carries the state built while
nobody was known, so replaying it afterwards would put back exactly what this change is about. The
window closes with what the person's namespace holds, and what the user does after that is written
normally. The alternative — writing through and repairing afterwards — was rejected because it needs
a copy of what it overwrote, which is the thing that does not exist.

**A person new to this product loses nothing by the same rule.** Where the adopted namespace answers
with nothing for a key, what the workbench holds stands and is written. The rule is about not
overwriting somebody's stored state, not about discarding work.

**"The user has moved" becomes one fact, not three.** The router keeps the opening address and
completes it when the routes change. Today the only thing that marks the user as having moved is the
browser's own history event, which a navigation inside the application does not raise, so a click in
the workbench leaves the opening address armed. It becomes one flag, set by any navigation the
workbench did not itself start, and read by every re-navigation the workbench performs on its own —
the opening address and an address it chose earlier alike.

## Risks / Trade-offs

- **A user action in the window between adoption and re-read is discarded.** → The window is a single
  read through the port, and the state that action was made against is replaced a moment later
  anyway. Keeping the write is what costs the person their arrangement.
- **The re-read applies to everything registered, which may reset more than the arrangement.** →
  That is the intent: everything read from the anonymous namespace was read from the wrong place.
  Registered channels are the boundary, and the change adds registrations rather than reaching past
  them.
- **A product with no identity at all pays for none of this.** No adoption ever happens, the latch
  never closes, nothing is read twice. Pinned by a scenario.
- **The opening address is abandoned in a case where the user would have wanted it.** A person who
  opens a deep link, clicks something in the first second, and expects the deep link to still win. →
  Chosen deliberately: between the workbench's memory of an address and the person's own last
  gesture, the gesture wins.
