## Context

See proposal.md, *Why*. What matters for the approach is the shape the rail has today. It is one
vertical flex column of buttons, fixed at forty pixels wide. The band anchored to the bottom is not
a container: it is the same list of buttons, with a top margin pushed onto the first of them, so top
band and bottom band share one scroll box and one drag list. Every entry carries a tooltip with its
name, and that tooltip is the only place the name appears.

The user's choice has to reach the rail from two places at once. The settings surface offers rows
per declared rail, and the rail reads back the row that names it. Both need the same identity for a
rail, and the frame already gives one: the region id the distribution declared.

Verified on the exploratory branch `feature/spike-rail-labels`, in the testbed at fourteen entries
and 900 pixels of height: labelled entries need seventy-two pixels of width, two of the fourteen
names do not fit in two lines, and the column runs past the bottom edge with labels on and comes
close to it with labels off.

## Goals / Non-Goals

**Goals:**

- One identity for a rail across the settings row, the stored choice and the rail itself.
- The overflow fix stands on its own. It is correct with labels off and must not read as a
  consequence of them.
- No change for a distribution that wants none: with the switch off, the rail renders as it does
  today, down to the tooltip.

**Non-Goals:**

- Deciding how many entries belong in a rail. Labels make a crowded rail more obviously crowded;
  they are not a licence to crowd it.
- A second navigation level in the side panel. That is the larger question this work came out of
  and it is not touched here.
- A distribution-level default for the labels. See the first decision.

## Decisions

**The choice is the user's, per rail, and the frame has no say.** The exploratory branch put an
optional flag on the region a distribution declares, which was the shortest way to see a labelled
rail at all. It is dropped. A distribution that does not want the choice offered removes the row,
which the settings surface already permits, and a distribution that wants labels on for everyone by
default is a want nobody has expressed. Carrying both a declared default and a user override would
mean two sources for one fact and a rule about which wins, for no case we have.

Rejected alongside it: a single switch for all rails. The frame guarantees that both sides are
symmetric and distinguishable by name, and a user who labels a crowded left rail has no reason to
widen a right rail holding two entries.

**The stored form is one entry per rail id, under one key.** One key holding a map from rail id to
choice, rather than one key per rail, so that the cross-tab announcement and the hydration register
once. This follows what the rail's own curation state already does with its hidden and placed
entries.

**The rows are generated from the declared rails, not written out.** The settings section lists one
row per rail the frame declares, inserted directly after the text size. A frame with no rail
contributes no row, which is what the settings surface already requires of a row that cannot work.
The row names its side with the wording the rail already uses for itself, so the accessible name of
the rail and the label of its switch cannot drift apart.

**The tooltip is dropped only for a name that is fully readable.** A tooltip repeating text the user
can already read is pure interaction cost, and on a touch device it is unreachable anyway. But two
of fourteen names in the testbed do not fit in two lines, and an entry shortened to *Account
without a..* is no more identifiable than its icon was. So the entry keeps its tooltip exactly when
its name is shortened, which has to be measured after layout rather than guessed from the string:
the same string fits or does not depending on the text size setting, the language and the font.

Rejected: always keeping the tooltip, which is simpler and reintroduces the cost the labels were
meant to remove. Also rejected: never keeping it, which quietly makes the longest names the least
identifiable.

**The bottom band moves out of the scroll box; the drag list stays whole.** The scroll box becomes
the top band alone, with the bottom band a sibling below it. The drag list stays on the rail as a
whole, because the entries of the two bands never trade places anyway: the sort predicate already
refuses a move that would cross bands. The scroll box has to be registered as a scrolling container
for the drag layer, or a drag inside a scrolled rail computes its drop position against the wrong
origin and the rail does not auto-scroll at the edge.

Rejected: scrolling the whole rail including the anchored band. It is one line of CSS and it defeats
the anchoring, which exists so that the way out of a workspace does not move.

**A rail is named for its side only against another rail.** The wording follows the frame rather
than the dock, so a distribution with one rail reads *Activity bar* and one with two reads *Left
activity bar* and *Right activity bar*. That takes a third shipped string rather than composing one
out of a side and a noun: the settings row takes a plain key with no values to fill in, and a
composed name would have to be assembled twice, once for the row and once for the announced region,
which is how the two would drift apart.

The testbed rewords the rail to *Toolbar* to prove that a product can replace one shipped string
without disturbing its neighbours. That demonstration is worth keeping and is in the way here, since
it hides the workbench's own word behind the testbed's. It moves to a neighbouring key in the same
group, which proves exactly as much.

## Risks / Trade-offs

- Drag and drop across a scroll boundary is where this is most likely to break, and the reordering,
  the move between rails and the curation all run through it. → Exercise reordering, cross-rail
  moves and the keyboard chord in the testbed with a rail long enough to scroll, both bands, labels
  on and off. The testbed is the only distribution that can produce the case.
- Measuring whether a name is shortened runs per entry and re-runs when the text size, the language
  or the rail width changes. Done carelessly it is a layout read in a render loop. → One observer
  per entry over its own box, writing a signal only when the answer changes.
- Labels are off by default, so nothing in the existing suites exercises them, and a regression
  would be silent. → The testbed carries a rail with labels on in at least one end-to-end path.
- Ten-pixel text under an icon is at the lower bound of legibility, and the text size setting scales
  it further down at its smallest step. → Scale the label with the text size setting rather than
  fixing it in pixels, so the smallest step does not produce something unreadable.
- A user who turns labels on for a rail that already overflows makes it overflow more. The two
  halves of this change are what make that survivable, so they ship together rather than in
  sequence.

## Migration Plan

No stored state changes shape and nothing needs converting. A user who never opens the setting sees
the rail they had. The exploratory branch is not merged; its content is reproduced here from the
decisions above rather than carried over.

## What it measured

Taken in the testbed after the work, at the fourteen entries of its left rail:

- The labelled rail is 72 pixels wide against 40 unlabelled, and the name is drawn at 0.625rem, so
  it follows the text size setting rather than a pixel.
- Two of the fourteen names do not fit in two lines (*Toggle the plugin theme*, *Account without a
  picture*). Exactly those two keep a tooltip; the other twelve have none.
- At an 800 pixel viewport the labelled rail already overflows: its scrolling band wants 559 pixels
  and has 520, so the last entry above the anchored band is cut and reached by scrolling. Unlabelled
  the same rail overflows at 460 pixels of viewport.
- The scroll boundary broke dragging once, and visibly: entries declared inside a template that sits
  outside the drag list are not found as its content, so reordering silently stopped working while
  the keyboard chord kept going. Declaring the entry template inside the list restored it. The
  end-to-end path is what caught it, and what keeps it caught.
