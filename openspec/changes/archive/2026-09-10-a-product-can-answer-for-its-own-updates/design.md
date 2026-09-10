## Context

See proposal.md — Why. The service already distinguishes the outcomes internally: it returns early on
a waiting version, on a check it could not answer, and on a failure, and falls through to "up to
date". Each branch calls the notification service directly. The automatic check runs on an interval
and on the page becoming visible, and hands what it finds to the same notice.

## Goals / Non-Goals

**Goals:**

- Three things a product can use: what a check found, what the last check found, and whether the
  workbench speaks.
- The default path through the code is the one it is today.

**Non-Goals:**

- No replacement for the notice's content. A product that wants different words uses the translation
  overrides it already has; this is about who speaks at all.
- No second way to apply an update. Applying is already the product's to call.
- No change to when the workbench checks, to the throttle, or to the marker.

## Decisions

**The outcome is a small closed set, not a boolean and not a free string.** Five values, each of which
a product would draw differently: a version is waiting, this is the newest, the question could not be
answered, an installation failed, and there is no offline machinery at all. A boolean would put "no
update" and "could not check" back in one bucket, which is the defect.

**The last check is state, not an event.** A product drawing a spinner and a result needs to survive a
re-render and to read what happened before it mounted, and an event that fired while its dialog was
closed would be lost. It carries the moment and whether the workbench made the check by itself, so a
product can say "checked five minutes ago" and can tell its own check from the workbench's.

**Announcing is switched off in the composition, not in the feature switches.** The feature switches
are the home for gestures a user performs; an announcement is not one. The composition options
already carry whether the offline machinery is registered at all, and the option that says who speaks
about it belongs beside it.

**Switching it off silences every notice about updates, not only the one for a waiting version.** A
product that draws its own answer draws all of them; leaving the failure toast on would be the same
double answer in the case that matters most.

## Risks / Trade-offs

- **A product switches announcing off and then draws nothing.** → The user would learn of a new
  version only through the marker. That is the product's decision to make, and it is the same
  decision as omitting the marker, which is already possible.
- **A fifth outcome, "no offline machinery", is not a check result at all.** → It is what a caller
  gets when it asks anyway, and it keeps the caller from drawing "up to date" in a build where no
  check is possible.
