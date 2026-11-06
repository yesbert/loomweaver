## Context

Applying an update asks about unsaved work, then activates the new version and reloads. The reload
ran also when activation rejected, so that the button never did nothing. Since the question was
added, that reload can cost the user the work they agreed to discard for an update that did not
happen.

The update service learned that the question had been answered by reading the dialog list before
and after asking, and waiting on the dialog it found. That couples it to how the question service
draws its question.

Adopting a namespace waits for the cross-window re-read, which awaits every registered handler,
and then for a read of every held key in the adopted namespace. Neither has a bound.

## Decisions

**A failed activation keeps the session.** The owner decided this on 2026-11-06. A reload that
follows a failed activation lands on the same version, so it gains nothing and loses the work. The
update stays on offer, so trying again is the same gesture as before. Activation that resolves
without activating anything still reloads: that is the case of an installation that failed, where
the reload is the retry the guide describes.

**The notice about a failed activation is shown also where the distribution announces updates.**
Taking over announcing silences what the workbench says about the state of versions. This notice
answers a gesture the user just made, like the unsaved-work question, which is also the workbench's
own. Without it the user would see nothing happen after agreeing to lose work. This goes beyond what
the owner stated and is the smallest option consistent with it.

**The question service tells when its question is answered.** Asking about unsaved work takes an
optional callback that runs once the user has chosen, before any saving. The update service uses it
to let a later request ask afresh, as it did by watching the dialog. The alternative, releasing the
request when the whole answer settles, would make a request during a long save join a save that
might never end, which an existing test pins.

**An adoption is given up after ten seconds.** The owner set the bound. After it, the workbench
settles in the person's namespace. What was written during the adoption is stored there as if the
namespace had held nothing, because the owner decided so. Values read only from the anonymous
namespace are not copied, and nothing anonymous is deleted. A late answer from the port or a handler
after the bound changes nothing any more. No new control starts the adoption again: a later session
that begins anonymously runs it as before.

**The notice about a given-up adoption is the workbench's own.** It is shown through the same
notification service as every other workbench notice, with a translation key in each shipped
language.

**Unit tests only.** The end-to-end suite has no test that applies an update, because the testbed
serves no service worker under its development server, so both decisions are pinned by unit tests.

## Risks / Trade-offs

- A slow but working port that answers after ten seconds loses the adoption for that session. The
  anonymous data stays, so the next session that begins anonymously can still carry it over.
- What was written during the adoption can replace what the person's namespace holds, where the
  read that would have found it never answered. That follows from the owner's decision for the
  timeout case.
