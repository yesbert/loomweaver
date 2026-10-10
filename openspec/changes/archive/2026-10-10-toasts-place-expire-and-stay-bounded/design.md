## Context

Notices are already cut in two. A service holds them as state: it adds, replaces by identity,
removes, and runs a timer where a lifetime was stated. An outlet reads that state and draws it, and
the workbench's frame mounts that outlet once, unconditionally. Everything that raises a notice goes
through the service: the workbench itself (updates, a refused capability, a failed save), a weaver
through its context, and an isolated plugin through its channel, where the input is rebuilt field by
field and the action, being a function, is dropped.

Three things the service does not know today shape this change. It does not know who raised a
notice: a plugin's identity only survives as a prefix on an identity the plugin chose itself, and a
notice without one gets a running number. It keeps no order of waiting, because everything is shown.
And nothing tells it that the user is looking.

The colours are there: each kind has a text colour and a tint among the semantic feedback tokens,
and the outlet uses only the text colour, on the symbol. The symbol registry is there too, and every
other contribution names a symbol through it.

See proposal.md for the motivation and for what was weighed against a third-party component.

## Goals / Non-Goals

**Goals:**

- Lifetime, holding, the bound and counting are decided where the notices are held, so that the
  workbench's drawing and a distribution's own drawing cannot disagree about them.
- An isolated plugin cannot keep a notice of the workbench's from being shown for longer than a
  time the workbench sets.
- No new dependency and no animation package.

**Non-Goals:**

- A title, a progress bar, dismissing by a click anywhere on the card, markup in the message, a
  component of the raiser's own, a configurable transition. Decided by the owner on 2026-10-10.
- Replacing the drawing of dialogs. Focus, Escape and the question about unsaved work make that a
  different size of change.
- A configurable bound on how many notices are shown. A distribution that wants another number
  draws notices itself.
- Stopping lifetimes while the window is in the background. It would keep a notice for a user who
  was away, and it is cheap, but nobody has missed it yet.
- Changing the position at runtime, or per notice.

## Decisions

**Lifetime is decided by kind, and stated as a table in one place.**

| Kind | Without a stated lifetime |
| --- | --- |
| info, success | leaves after 5 s |
| warning | leaves after 8 s |
| error | stays |

The warning's 8 s is the lifetime the refused-capability notice already states for itself. One value
for everything was weighed and dropped because a warning is usually longer to read and more often
carries an action. The numbers are not in the specification, which only says a notice leaves after
a time long enough to read.

**A stated lifetime of zero keeps meaning "stays".** Today zero and absent both mean that. Absent
now means "by kind", and zero stays the way to say "stays". The alternative, a new field for
staying, would add a second way to say what zero already says and leave zero meaning nothing.

**A lifetime starts when the notice is shown, not when it is raised.** Otherwise a notice that
waited would be shown for a moment or not at all.

**One hold for all notices, not one per notice.** While the pointer is over the notice area or focus
is inside it, every running lifetime is stopped and what is left of it remembered. When the hold
ends, each notice runs what was left, and at least 1 s. Holding only the notice under the pointer
was the reference component's behaviour and is rejected: its neighbours keep leaving, so the stack
shifts under the pointer and the card the user was reaching for moves. The service offers the hold
as two calls, begin and end, and the workbench's outlet calls them from pointer and focus events on
its region. A distribution's own drawing calls the same two.

**The pointer holds by moving, not by being there.** The first implementation began the hold when
the pointer entered a notice. The end-to-end suite showed what that does: a control at the bottom
right raises a notice, the notice is drawn over the control and under the pointer that just clicked
it, and it then never leaves until the pointer is moved. Fifteen tests that click such a control
twice hung on it, and a user would have met the same. The hold now begins on pointer movement
inside the notices, which a resting pointer does not produce.

**Focus is handed on when a notice is dismissed.** A notice dismissed from the keyboard would take
the focus with it and leave the hold begun for a notice that no longer exists. The outlet moves the
focus to the next notice's dismiss control, where the hold is still true, and when there is none
the last dismissal ends the hold in the service. A notice dismissed by pointer gives up the focus
instead, so that leaving with the pointer ends the hold.

**The bound is three shown, and waiting is first in, first out.** No priority for the workbench's
own notices. A priority was weighed because a plugin could otherwise keep the workbench's notice
waiting, and is not needed once an isolated plugin's notices are bounded in number and in time: a
notice then waits at most as long as the notices ahead of it live. A plugin composed into the page
is the product's own code and is not guarded against.

**What is readable is what is to be shown.** The list the outlet reads today becomes the bounded
list. The waiting line is the service's own business; no count of waiting notices is offered until
somebody draws one.

**The notices are held by a board the published service fronts.** Counting a repeat needs "the same
raiser", and so does the isolated plugin's bound, and the sandbox channel has to ask how many
notices a plugin would hold. None of that belongs on the service a distribution injects. So the
state lives in an internal board that takes the raiser beside the input and answers that question;
the published service forwards to it without a raiser, which is what marks a call as the
workbench's or the distribution's own. The plugin's context and the sandbox channel talk to the
board. The raiser is not a field of the published input, so a plugin cannot claim to be someone
else, and the board is what gives a plugin's chosen identity its prefix.

**A repeat is: same raiser, same kind, same wording, same symbol, no stated identity.** The action's
label is compared too, and the newer action replaces the older, because the two are closures and
the newer is the one that is current. A notice with a stated identity is never counted: the update
notice is raised under one identity on every check, and "an update is waiting, twice" would be
wrong.

**The count is part of the notice's text.** It is drawn as a small marker and worded for assistive
technology through a translated string, inside the same live element, so a repeat changes what that
element says. Whether a screen reader reads a changed count again differs between screen readers,
which is why the specification does not promise it.

**An isolated plugin's limits are applied where its call crosses.** The channel already rebuilds the
input there. It additionally turns "stays" and anything longer than 15 s into 15 s, gives an error
without a lifetime 15 s, and refuses a further notice once the plugin holds three, through the
report path every refused call already uses. Applying the limits in the service instead would make
the service know about isolation, which nothing else in it does.

**The symbol is a name, like every other symbol field.** An optional name on the input, resolved by
the registry, drawn in the kind's colour. A name the registry does not know is handled the way the
registry already handles one everywhere else; the notice gains no rule of its own.

**The card takes the kind's tint and a border in the kind's colour.** Both come from the feedback
tokens that exist. A product recolours notices by setting those tokens, as it recolours every other
piece of feedback. Per-notice colours were not asked for and would take the contrast of the pairing
out of the workbench's hands.

**The position is a composition option, typed as six names.** `top-left`, `top-center`,
`top-right`, `bottom-left`, `bottom-center`, `bottom-right`, the last being the default. It sits
beside the other options a distribution passes when it composes the workbench, because it is a
decision about the product and not a capability a user can see. Below the width at which the side
panels become overlays the notices are centred at the chosen edge and keep their width, so that
"narrow" stays one condition. Spanning the full width was drafted first and dropped when it was
looked at: on an upright tablet a short notice became a bar across the whole window. The order in the document follows the order on screen, so the tab order matches what is
seen at either edge.

**Leaving the drawing to the distribution is a second composition option, a boolean that defaults
to drawing.** The frame then does not mount the outlet. An injection token for a replacement
component was weighed and rejected: it would make the workbench instantiate a component it knows
nothing about, where the distribution can simply place its own in its own template and read the
state. The outlet stays published, so a distribution with a root component of its own keeps using
it.

**The transition is plain CSS on entering and leaving.** The framework's own enter and leave hooks
for elements are used, to be confirmed against the framework's current guidance when the change is
applied. A reduced-motion preference removes the transition through a media query, which is what
the existing guarantee on motion asks for.

**The workbench's own notices, reviewed one by one.**

| Notice | Today | After |
| --- | --- | --- |
| A version is waiting | stays (nothing stated) | stays, stated |
| Installing failed, offline storage broken | stays (nothing stated) | stays, stated |
| Already current, check unanswered | states 4 s and 6 s | unchanged |
| Capability refused | states 8 s | unchanged |
| Saving failed | warning, stays (nothing stated) | raised as an error, so it stays |
| Still unsaved after saving | warning, stays (nothing stated) | leaves by kind |

"Saving failed" becomes an error because it is one, and because the save that runs when a surface
is hidden fails while the user is looking elsewhere. Counting keeps five failed saves from being
five cards.

## Risks / Trade-offs

- [A weaver's notice that stayed by default now leaves] → It is the point of the change, and it is
  announced as breaking in behaviour. First-party weavers and the demo are reviewed call by call in
  the tasks. A raiser restores the old behaviour by stating zero.
- [A notice with an action can leave before the user reaches it] → The hold covers pointer and
  focus, the remainder after a hold is at least 1 s, and the workbench's own notices that carry an
  action state their lifetime. The documentation says that a notice offering an action should state
  one.
- [A timed notice is a known accessibility concern] → Errors stay, every notice can be held by
  focus, and nothing that is only said in a notice is required to act. The accessibility reference
  is updated to say so.
- [The tinted card is a new colour pairing] → The automated contrast scan runs over every kind in
  light and dark before the change is called done.
- [A distribution that draws notices itself forgets to announce them] → The limit is stated in the
  specification and in the guide, with the two roles the workbench's own outlet uses.
- [An isolated plugin that legitimately needs a lasting message loses it after 15 s] → The sandbox
  channel offers no host dialog, which the first draft of this note wrongly assumed. What it has is
  its own surface and the badge on its tab, and the guide for isolated plugins names both. That is a
  weaker answer than a dialog, and it is accepted: the alternative is a notice only the user can
  remove, raised by code the product did not write.
- [The initial bundle grows] → The bundle ratchet measures it; the change adds no dependency.

## Migration Plan

Nothing is migrated automatically. The pull request and the release notes say, first, that a notice
without a stated lifetime now leaves unless it is an error, and how to keep one. Whether that opens
a new version line is decided with the owner when the change is released.

## Open Questions

- Whether 5 s and 8 s read well in practice. Both are single constants and can be tuned after the
  change is tried in the demo without touching the specification.
