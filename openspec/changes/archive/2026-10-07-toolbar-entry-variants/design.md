## Context

A toolbar entry reaches the element as already resolved data: the page's toolbar service resolves
the slot's menu entries and surface actions, words them and hands the element a list of entries; an
isolated surface is told the same list over its channel and draws it with the same element, which
the frame kit bundles from the shell's surface kit. The element decides the look from one fact
today: an icon makes an icon button, no icon makes a faint text button.

Ownership is already recorded. The registry keeps the contributing plugin beside every menu entry,
and the toolbar registry keeps the plugin that registered each toolbar slot, which is how two owners
of one slot are refused today. The surface registry knows which plugin owns a surface, which is what
lets an owner tell its own actions from contributed ones.

The button vocabulary already lives in the plugin contract, and the frame stylesheet already carries
every button variant, so neither the type nor the colours have to cross anything new.

## Goals / Non-Goals

**Goals:**

- One place decides what look an entry gets, and both the page and an isolated surface draw what it
  decided.
- The colour pairings in a toolbar are the button's pairings, so the contrast guarantee the
  workbench gives for its colour pairings covers them without a new list.

**Non-Goals:**

- A variant on a menu entry drawn in a menu. Decided by the owner on 2026-10-07: toolbar only.
- A variant on the actions a surface declares in its registration. The owner of a surface reaches
  the same look by contributing an entry to its own actions slot, which this change honours as the
  owner's.
- A split button, an action beside a separate chevron. The primary entry that opens a slot opens it
  as a whole, as a bar button does.
- A display switch between icon, title and both. Only primary forces the title; no other variant
  changes what an entry shows.

## Decisions

**The full button vocabulary, not a toolbar subset.** Decided by the owner on 2026-10-07. The
alternative weighed was primary and danger only, since those are the two cases the finding names
and each further variant is another pairing to keep readable at toolbar size. The full vocabulary
wins because a plugin author already knows it from the button, and an entry and a button that name
the same variant then read the same everywhere.

**Absent is not `default`.** A toolbar entry without a variant keeps today's look, which is close to
`ghost`. `default` is the bordered, raised button. Mapping absent to `default` would change every
existing toolbar; making `default` mean "today's look" would make the same name draw two things.
So all seven names draw exactly what the button draws, and "no variant" stays a look of its own.
The documentation says this in one sentence, because it is the one place a reader can trip.

**A refused primary falls back to no variant, not to `default`.** The finding asked for `default`.
`default` is a bordered button and still stands out in a row of faint entries, so a contributor
asking for primary would still get more weight than its neighbours. No variant gives it exactly
the weight every contribution has.

**The owner rule is applied once, where the entry is resolved, before the view is split.** The
toolbar service already turns resolved entries into the drawn list, and the isolated surface's
answer is mapped from that same view. Applying the rule there means the page and the surface cannot
disagree, and an isolated surface is never told primary for an entry it may not draw as primary.
The resolved entry has to carry the contributor for this; the slot's owner is the toolbar's
registrant, or for a surface's actions slot the plugin that owns the surface. An entry no plugin
contributed is not the owner's, so it gets no primary either.

**Reported once per entry and slot.** Through the console, the way two owners of one slot are
reported today, and remembered for the life of the page so that a toolbar redrawing on every change
does not repeat it. An unknown variant name is reported the same way.

**An unknown name is dropped, not refused.** Code in the page is held to the vocabulary by its type.
Across the channel a sandboxed plugin's entry is validated as data; refusing the whole registration
for a misspelt look would lose the entry, its command and its gating over a cosmetic mistake. The
channel keeps the entry, drops the name and reports it.

**Drawing.** An entry with a variant takes the button's variant classes and keeps the toolbar's own
height, so a primary entry is as tall as its neighbours; with an icon and no forced title it is
square, as an icon button is. A primary entry draws its icon, then its title, then its shortcut where
it has one. An entry that shows its title and opens a slot ends with a downward chevron hidden from
assistive technology, since the entry already announces that it opens a menu. A folded entry keeps
its look in the fold tray, because the tray holds the same element.

**Ignored in a menu by not reading it.** The menu renderer never reads the field, which is the same
way a nested slot is ignored in a menu. No stripping step is needed.

## Risks / Trade-offs

- [A plugin fills its toolbar with coloured entries] → The vocabulary is its own toolbar's business;
  primary is kept to the owner, and every other variant has the pairing contrast the button has.
- [A contributed danger entry looks louder than the owner wants] → That is the point of the
  finding; a distribution that disagrees removes the contribution by its identity, as it removes any.
- [The chevron changes existing labelled entries that open a slot] → It is the only visible change to
  an existing toolbar, and it corrects a control that offered its menu only to assistive technology.
- [An icon-only entry with a filled variant becomes a coloured square that says nothing] → It still
  carries its title as tooltip and accessible name; primary, where it matters most, always shows its
  title.

## Migration Plan

Additive. No consumer has to change. TreeWeaver's knowledge base can replace its primary cell and the
separate slot entry with one primary entry that opens its sources slot, once a release carries this.
