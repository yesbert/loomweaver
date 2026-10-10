## Context

Notifications are held by an internal board that the published service fronts. The board knows who
raised each one, because counting a repeat needs it. The bounds on an isolated plugin were applied
elsewhere: the channel's sanitiser shortened the lifetime, and the channel asked the board how many
notifications the plugin would hold before passing the call on. The outlet asked the browser whether
the pointer was on the notices, through the hover state of its region.

Both arrangements failed the same way: the rule lived at a distance from the state it was a rule
about. See proposal.md for what that let through.

## Goals / Non-Goals

**Goals:**

- Every bound on a raiser is enforced by the board, at the one place every raise passes.
- The outlet's hold depends on nothing the browser may fail to report.

**Non-Goals:**

- Changing what a trusted plugin or a distribution may do. A repeat by either still starts the
  lifetime over, as agreed with the owner on 2026-10-10.
- Changing the form of a notification's identity. A distribution dismisses the workbench's notices
  by identities it knows, so those stay as they are.
- A browser test for each of the six positions. They are pinned by the classes the outlet sets, and
  two were looked at by hand.

## Decisions

**A raiser may be bounded, and the board holds the bound.** The sandbox runtime tells the board,
when a frame plugin's channel is built, that this raiser holds at most three notifications and that
none lives longer than 15 s; it takes the bound away when the plugin is deactivated. From then on
the board applies it to everything that raiser raises: a stated stay and a longer lifetime become
the bound, a further notification beyond the number is refused by throwing, and a repeat or a
replacement leaves the running lifetime alone. The channel goes back to sanitising and passing on,
and the refusal reaches the developer through the report path every thrown call already takes.

The alternative was to keep the bounds at the channel and add a third rule there. It was rejected
because the channel sees one call at a time and the defect was about a sequence of calls. The board
does not learn what a sandbox is by this: it learns that some raisers are bounded, which is what it
needs to know.

**A bounded raiser's repeat does not restart the clock; an unbounded one's does.** One rule for
everybody was weighed, in either direction. Never restarting would undo what the owner asked for: a
notice that keeps happening should stay while it does. Always restarting is the defect. The
difference is the same one the rest of the bound makes, between code the product composed and code
it did not.

**A notification is found by its raiser and the name the raiser gave it.** The board keeps both
beside each notification and matches on the pair, so the string a plugin's name and chosen identity
spell together no longer finds anybody else's. The published identity stays the joined string
wherever that string is free, which is every case but the collision; where it is taken, the newcomer
gets a generated identity, and generated identities skip any that are live. The application's
identities are its own: where it names a notification and a plugin's notification already carries
that string, the plugin's is given a generated identity and the application takes the one it asked
for, so that dismissing by an identity it knows keeps working. A raiser that passes back the
identity it was returned is found by that too, also after that identity was taken back, and is
returned the same identity every time, which makes true what the plugin contract already says about
replacing.

**Attention belongs to a notification, and ends when it is no longer shown.** The outlet remembers
the identity of the notification the pointer last moved on and of the one that holds the focus, and
derives "the user is attending" from those two and the list of shown notifications: attended means
one of the two is still shown. When that turns false, the hold is released. Nothing is ever
"forgotten" by a step that could be skipped; an identity that is no longer shown simply does not
count.

The outlet listens for pointer movement and focus on its region and reads the notification from
the card the event came from. Listening on each card was tried and failed in the browser: the
framework stops delivering events on a card once its notification is removed, while the card
itself stays for the length of its fade. A pointer jumping from an attended notification onto such
a card therefore told the outlet nothing, the region reported no leave, and the hold stayed. At the
region the same movement arrives, names a notification that is no longer shown, and ends the
attention.

The outlet releases only when its own attention ends. A hold somebody else began through the
published service is not ended because a notification was raised or replaced.

This replaced two earlier attempts, and why they failed is the reason for the shape. The first
asked the browser's hover state, which is true for a pointer that never moved and whose end nothing
reports when the card under the pointer is removed. The second remembered that the pointer was on
the region and cleared that on a dismissal by pointer; a second review showed that a pointer moving
during the 200 ms a dismissed card takes to fade set it again, after which Chromium sent no leave,
and that a dismissal from the keyboard or by the application never cleared it at all. Both relied on
an event arriving for something that had been removed. The third relies on the one thing the outlet
always learns: what is shown.

The cost is that a pointer resting perfectly still on a neighbour after the card under it went away
does not hold the neighbour, which is the rule a resting pointer already follows.

**An isolated plugin's waiting notification gives way.** The first version of this change kept
waiting strictly first in, first out, and claimed that a notification of the workbench's then waits
at most one bounded lifetime. A review measured 45 s behind one plugin with two places taken by the
application's own notifications, and 30 s behind two plugins: the lifetime starts when a
notification is shown, so a plugin's three pass through one free place one after another. A
notification from a raiser without limits is now queued ahead of the first waiting one from a raiser
with limits. A shown notification is never moved, so nothing jumps on screen, and what the
workbench's notification can still wait for is one shown, limited notification, which leaves within
the bound. Starting a limited raiser's lifetime when it raises was the alternative; it was rejected
because a plugin's notification could then leave without ever having been shown.

**Whether a notification is limited is recorded on it.** The limits are looked up when a
notification is first shown and kept with it, so a repeat cannot change what it is by arriving at a
moment the raiser's limits are not registered.

**The board refuses to begin a hold with nothing shown.** A hold is about the notifications on
screen. With none, a hold could only be inherited by the next one, which nobody is attending to.

**The focus goes to the neighbour.** After a dismissal from the keyboard the focus moves to the
dismiss control of the notification that follows on screen, or the one before where there is none.
The first one was a shortcut.

**The focus is handed on, and nothing else is done to it.** A dismissal by pointer no longer blurs
the control: once attention ends with the notification, where the browser's focus lingers for the
length of a fade does not matter.

**The static classes go back into the template.** The lint guardrail that rejects an unknown
utility reads `class` attributes in templates. Class lists assembled in TypeScript are outside it,
so only what varies stays there: the placement and the kind's colours, as the feedback colours
always were.

**One word per layer.** The published surface says notification for the state and toast for the
drawing and for what a plugin calls; that predates this work and is not renamed. The internals
added a third word, notice, which is the specification's word and nobody else's. They take the
published one: the board, its entries and the lifetime table are named for notifications, and the
board's verb is the service's, show. "Hold" is kept for the user attending; what a raiser has on the
board is called live.

**A lifetime is capped at what a timer can hold.** About 24 days. Beyond that the platform's timer
wraps and fires at once, which turned a very long lifetime into none.

## Risks / Trade-offs

- [The fix for the hold rests on events the unit-test DOM also sends, so a unit test cannot tell a
  right fix from a wrong one] → A browser test dismisses a notice by pointer with others shown and
  waits for them to leave, and it is run against the code before the fix to see it fail.
- [Renaming internals touches every test beside them] → The published declarations are compared
  before and after by the packed-declaration guard; nothing a consumer imports changes name.
- [A bounded raiser's replacement shows new content for less than its own stated lifetime] → That is
  the point. The guide for isolated plugins says so.
