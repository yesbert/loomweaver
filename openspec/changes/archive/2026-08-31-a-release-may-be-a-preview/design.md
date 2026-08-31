## Context

See proposal.md for motivation. What shapes the approach is how little of this is new.

The tag that triggers a release is matched loosely enough that a prerelease tag already reaches the
workflow, and the guard that follows compares the tag with the stamped version as plain text, so it
already accepts one. The version is stamped from a single source into a generated module and reaches
the workbench through a service that already exposes it. The demo already consumes published
packages by a range, and the deployed demo already installs from the registry.

Three things are missing, and only three: the publish step names no distribution tag, the version
tool cannot count a prerelease, and what the workbench exposes about its version does not say
whether it is one.

## Goals / Non-Goals

**Goals:**

- Work that is not finished can be published without reaching anyone who did not ask for it.
- The demo can show it, publicly, marked as what it is.
- The two facts that could disagree — which tag a release goes to, and whether the workbench calls
  itself a preview — are both derived from the version, so neither can drift.

**Non-Goals:**

- A branch for maintaining the released line while the next one is in preview. Named as an accepted
  cost in the proposal rather than solved here.
- Deciding what a preview looks like. The workbench exposes the fact; the demo is one product's
  answer and not a pattern anyone must copy.
- Any change to how a range resolves. Below 1.0 a caret over a preview already covers the later
  previews of that line and the final version, so the demo leaves the preview line by itself.

## Decisions

**The distribution tag is read out of the version, not passed alongside it.**

A version carrying a prerelease marker publishes to the preview tag; one that does not publishes to
the default. There is no second input, so there is no way to publish a preview as the thing everyone
installs, which is the failure this whole change exists to prevent.

*Alternative rejected — an input on the release run, or a variable in the workflow.* It would be one
more thing to get right at the moment of least attention, and getting it wrong publishes unfinished
work to every consumer. A published version cannot be withdrawn.

**The version tool gains two operations, not a free-form version argument.**

Starting a preview series for the next line, and advancing the current series. Both derive the new
version from the current one exactly as the existing operations do, so the tool stays the only place
a version is invented.

*Alternative rejected — letting the caller pass an arbitrary version string.* It would make the tool
a text editor with extra steps, and the guard in the release workflow exists precisely because a
hand-written version and a tag drift apart.

**The workbench answers the question; it does not draw the answer.**

The capability already says the workbench exposes the version so that a distribution can show it.
Whether the running version is a preview is the same kind of fact, so it is exposed the same way and
shown by the same party. A workbench that drew a badge of its own would be deciding a product's tone
for it — the same imposition the inset default was, and removed for the same reason.

*Alternative rejected — marking a preview inside the widget that shows the version.* It is the
shell's own widget, so it would be defensible, but a product that ships a preview deliberately would
have no way to quiet it short of replacing the widget. Exposing the fact costs a product one line
and leaves the judgement where it belongs.

**The demo is the worked example, and it draws the badge before the version.**

A bar item of the demo's own, ordered ahead of the version, shown only while the running version is
a preview. It disappears by itself when the line is released, because the fact it reads flips on its
own.

**The self-report answers it too, and that is a developer's tool rather than a guarantee.**

Asked what it is composed of, the workbench reports its layout, the capabilities a distribution
turned off and the contributions it omitted. It does not report the version, which is exactly the
question a developer has when something behaves unexpectedly. It gains the version and whether that
version is a preview.

This is deliberately not a requirement. Nothing promises that self-report exists or what it contains,
and promising it now would freeze a tool that should stay free to say whatever turns out to be worth
saying.

## Risks / Trade-offs

- **A preview published to the wrong tag reaches everyone and cannot be withdrawn.** → The tag is
  derived from the version, so the only way to get it wrong is to stamp the wrong version, which the
  release guard already refuses.

- **The demo pointing at a preview stops demonstrating what a consumer installs by default.** → It
  still demonstrates something a consumer can install, since the preview line is public; the demo's
  README says which line it currently consumes rather than claiming a line it does not.

- **A preview series that runs long leaves the released line without a home for fixes.** → Accepted,
  and recorded where releases are described. A fix would be branched from the released line's tag.
  Building for it now would be building for a situation that has not arisen.

- **Two lines invite the question of which one a bug report is about.** → The workbench already
  exposes the version and now says whether it is a preview, which is exactly what a report needs.

## Migration Plan

None. Nothing published changes, nothing stored changes, and a consumer who never asks for the
preview tag never sees a preview. The released line stays where it is until the series lands.
