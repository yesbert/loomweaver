> **Status:** approved — approved for implementation on 2026-10-10.

## Why

The workbench's notices are the weakest piece it draws. A notice stays until it is clicked away
unless its raiser thought of a lifetime, it always sits at the bottom right, its kind shows only in
the colour of a small symbol, and it appears and vanishes without a transition. Nothing bounds how
many there are: a failed save raised five times is five cards, and an isolated plugin can raise
notices that stay, without limit, each of which the user has to dismiss by hand.

A distribution that wants notices drawn another way has no supported route either. The list of
notices is readable, but the workbench's own drawing is fixed in its frame, so a product can only
add a second drawing beside it.

A third-party component was weighed and rejected by the owner on 2026-10-10. The most used one for
this framework is archived and stops one major version back; the maintained alternative would add
two peer dependencies to every product built on the workbench. What is missing here is small, and
every item below is behaviour the workbench should own.

## What Changes

- **A notice leaves by itself.** A notice whose raiser states no lifetime leaves after a time long
  enough to read it. A notice of the error kind stays until it is dismissed, and a raiser can still
  state a lifetime, or state that the notice stays. **BREAKING (behaviour, not types):** a notice
  that stayed only because nothing was stated now leaves, unless it is an error. A raiser that
  relied on that states it.
- **A notice the user is attending to does not leave.** While the pointer rests on the notices or
  keyboard focus is in one, none leaves by itself; afterwards each stays a short remainder.
- **The distribution chooses where notices appear:** at the top or the bottom edge, to the left, in
  the centre or to the right. The newest notice sits nearest that edge. Without a choice they stay
  where they are today.
- **Only a small number are shown at once.** Further notices wait in the order they were raised and
  are shown as room is made. A waiting notice's lifetime starts when it is shown.
- **A repeated notice is counted, not stacked.** The same raiser raising the same notice again while
  the first is still there gets no second card: the first shows how often it was raised and its
  lifetime starts over.
- **An isolated plugin's notices are bounded in number and in time.** They always leave by
  themselves, an error included, and the plugin holds only a bounded number at once. This closes
  the gap named above.
- **A notice shows its kind by colour as well as by symbol,** and a raiser may name another symbol.
  The kind keeps deciding colour and urgency.
- **Notices appear and leave with a transition,** which does not play where the system asks for
  reduced motion.
- **A distribution may draw notices itself.** The workbench then draws none, everything raised stays
  readable, and lifetime, the bound and counting keep working because they are not the drawing's.
  Announcing the notices becomes the distribution's.

Deliberately not part of this change: a title above the message, a progress bar for the remaining
time, dismissing by clicking anywhere on the card, markup in the message, a component of the
raiser's own per notice, and a configurable transition. Dialogs keep their fixed drawing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-primitives`: the requirement on raising a notice gains the symbol and the colour by kind; new
  requirements cover the lifetime, holding a notice the user attends to, the position, the bound,
  counting a repeat, and a distribution drawing notices itself.
- `accessibility`: the requirement that transient messages are announced states its limit where a
  distribution draws notices itself.
- `plugin-sandbox`: an isolated plugin's notices always leave by themselves and are bounded in
  number.

## Impact

- `@loomweaver/plugin-sdk`: the notice a plugin raises gains an optional symbol name; the
  documentation of its lifetime changes. Additive in types.
- `@loomweaver/shell`: the notice service decides lifetime, holding, the bound and counting; the
  notice outlet draws position, colour, the count and the transition; two composition options are
  added, one for the position and one for leaving the drawing to the distribution; the sandbox
  channel bounds an isolated plugin's notices; the workbench's own notices state their lifetime
  where they are meant to stay.
- First-party weavers and the demo: every notice raised without a lifetime is reviewed, because it
  now leaves.
- Documentation of notices for a distribution, for a weaver and for an isolated plugin, and the
  accessibility reference.
- No new dependency.
- Dissolves no legacy source.
