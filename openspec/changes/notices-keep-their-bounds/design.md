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
gets a generated identity, and generated identities skip any that are live. A raiser that passes
back the identity it was returned is found by that too, which makes true what the plugin contract
already says about replacing.

**The outlet remembers which region the pointer is attending.** Pointer movement on the region
records that region; pointer-leave and a dismissal by pointer forget it. The question "is the
pointer attending" is whether the recorded region is the one on screen, so a region that was
removed and drawn again starts unattended without anything having to reset a flag. Asking the
browser's hover state was wrong twice: it is true for a pointer that never moved, and nothing
reports its end when the card under the pointer is removed.

**A dismissal by pointer ends the pointer's attention.** The card under the pointer is going away,
and Chromium will send no leave for it. If the pointer is still on another notice, the next movement
says so. The cost is that a pointer resting perfectly still on the neighbour after a dismissal does
not hold it, which is the same rule a resting pointer already follows.

**The board refuses to begin a hold with nothing shown.** A hold is about the notifications on
screen. With none, a hold could only be inherited by the next one, which nobody is attending to.

**The focus goes to the neighbour.** After a dismissal from the keyboard the focus moves to the
dismiss control of the notification that follows on screen, or the one before where there is none.
The first one was a shortcut.

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
