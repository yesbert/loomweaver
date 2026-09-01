## Context

See proposal.md — Why. Four pieces of current state shape the approach.

A tab's label is worked out in one place, where a stored tab meets the route table, and a carried
label is laid over a derived one. The result is one value with no memory of where it came from. The
single writer takes that value and stores it. So the distinction the capability draws between a
carried label and a derived one exists in the prose and nowhere in the types.

An empty pattern matches every address, because a pattern with no segments is vacuously satisfied.
The longest match wins, so the surface at the bare address only takes an address it does not own
when nothing longer has registered. That is not an edge case: a sandboxed plugin registers over RPC
after the panes are restored, so on every cold restore its addresses are momentarily unclaimed.

The workbench already repairs stored panes as it loads them. The change of 2026-08-31 put that in
place for a tab another workspace claims: it is dropped as the panes load, one message is written in
development, and a dock left empty by the drop goes with it. This change extends the same pass
rather than adding a second one.

The distribution that reproduces this has a surface at the bare address beside a plugin that
registers late. The testbed has no such pair, which is why the suite never caught it.

## Goals / Non-Goals

**Goals:**

- What is stored is only what a tab carried, so a wrong guess cannot outlive the moment it was made.
- A tab whose content has not registered says so by showing its address, and labels itself properly
  the moment that content arrives.
- A profile already carrying a borrowed label recovers by being opened.

**Non-Goals:**

- Changing what an address matches. Route matching decides which surface answers an address, and a
  surface at the bare address owning what lies below it is deliberate.
- A stored-state version or a migration step. The repair pass runs on every load and needs no marker.
- Teaching the tab strip to wait, in the sense the router waits. Deriving nothing and showing the
  address is already what the capability asks for, and it needs no waiting.

## Decisions

### Provenance travels with the label, rather than being inferred later

The projected tab gains one fact: whether its label is the tab's own or was worked out. The writer
stores a label only for the first kind. Nothing else changes about how a label is chosen or shown.

Alternatives considered. **Comparing the label against the declaration before storing** was rejected
because it asks the writer to re-derive what the reader already knew, and it cannot tell a carried
label that happens to equal the declaration from a derived one. **Not storing labels at all** was
rejected because the capability requires a refined title to survive a restart. **A separate field
for the derived label** was rejected as the same fact in two places.

### The bare address is not a declaration for every address, for labelling only

The restriction is applied where a label is derived, not in route matching. A surface at the bare
address that owns the addresses below it keeps doing so; what it stops doing is lending its title
and icon to an address it was never asked about.

This is deliberately narrower than fixing the match. `restBelow` treats the bare address as owning
the whole remaining path on purpose, and the routing capability speaks of an owned remainder. A
change there would reach far past this defect, and the defect does not need it.

### The repair joins the pass that already exists

Stored panes are already walked as they load, and a tab that does not belong is already dropped
there. A borrowed label is repaired in the same walk: the tab stays, its label goes.

Which stored labels are borrowed is decided by what the active workspace declares. A tab the
workspace declares never carries a label of its own, because its label comes from the content's
declaration every time. So a stored label on a declared tab can only have been stamped, and dropping
it is safe without knowing the route table, which the storage layer does not have.

A label on a tab the user opened is left alone. That tab may legitimately carry a refined title, and
guessing at it would break the guarantee this change is defending.

Alternatives considered. **A stored-state version with a one-off sweep** was rejected: it would
repair once and leave nothing in place for the next way a wrong label is written, whereas the pass
already runs every load. **Leaving recovery to a release note** was rejected because the symptom is
a mislabelled tab, which nobody reports and nobody connects to clearing browser storage.

### The testbed gains the pair that reproduces this

A test needs a surface at the bare address beside an address that registers late. The testbed
already has the second, in its sandboxed frame plugin; what it lacks is a workspace holding a tab at
that address while another surface answers the bare one. That arrangement is added to the testbed
distribution, because a fixture built only for the test would prove the test rather than the
workbench.

## Risks / Trade-offs

- **A tab that legitimately carries a refined title could lose it** if the rule for "could not have
  carried a label" is drawn too wide. → It is drawn at what the workspace declares, which is the one
  case where the workbench is certain the label was never the tab's; everything else is untouched.
- **The repair is silent to the user**, which is right, but it also means a wrong rule would be
  silent. → The same development-mode message the existing repair writes covers this one, so a drop
  is visible to whoever is building.
- **Showing an address instead of a title is uglier** for the moment before a late plugin registers.
  → It is what the capability asks for, it is honest about what the workbench knows, and it lasts as
  long as the plugin takes to register.
- **Adding the pair to the testbed changes a distribution that many tests read.** → It is added as
  its own workspace and surface rather than by altering an existing one, so no test that does not
  look for it can see it.
