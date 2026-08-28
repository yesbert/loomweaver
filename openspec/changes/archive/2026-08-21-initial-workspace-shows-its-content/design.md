## Context

On a first boot with nothing stored, the workbench adopts the declared workspace and lays its
baseline out — panes, tabs, sidebar occupancy — in the same shape a switch would produce. A switch
also navigates to the pane's active tab; the adoption deliberately does not, and says why in its own
comment: the address the app booted with should win, so a shared link is not overwritten.

The two paths therefore disagree about the same workspace, and only the boot path is wrong about it.

## Goals / Non-Goals

**Goals:**

- Make the adopted workspace show its content when nothing was named, so declaring a starting
  workspace means what a reader assumes it means.
- Keep the deep-link guarantee exactly as strong as it is.

**Non-Goals:**

- Changing what a switch does. It already navigates and is not in question.
- Changing the adoption rule itself — which workspace is adopted, when, and that the choice is
  written immediately so a later boot reads the user's own choice.
- Introducing a way for a product to opt out. If a product wants its root surface on a first visit,
  it declares a workspace whose content is that surface — which the grammar already allows and the
  testbed already does.

## Decisions

**The bare address does not name content.** The distinction is between an address someone was sent
and an address someone arrives at by opening the application. A path names content; the absence of a
path names nothing. Whether a product happens to register a surface at the root is irrelevant to
that question — the testbed serves one and the demo serves one, and in neither case did the visitor
ask for it.

*Alternative rejected:* "navigate unless the boot address resolves to a surface". It sounds more
careful and is worse: it makes the behaviour depend on whether some plugin registered a root route,
so the same declaration behaves differently in two products for a reason neither of them stated. It
is also exactly the accident that hid this for as long as it did.

*Alternative rejected:* a flag on the definition. A product would have to opt into the behaviour its
declaration already implies, and every product would set it.

**The navigation happens where the baseline is laid out, not at a router guard.** The adoption is
already a single, once-per-boot event that knows the workspace it adopted; the tab to navigate to is
the same one a switch reads. Anything earlier would have to re-derive the state that this code has
in hand.

## Risks / Trade-offs

**A product relying on the current behaviour would see its first visit change** → the effect is
limited to a first boot with nothing stored, in a product that declares a starting workspace whose
content differs from its root. Both distributions in this repository are covered by tests, and the
platform ships no other consumer of the declaration; a product that wants the old result declares it
instead of inheriting it.

**A declared tab whose route no longer exists would navigate into nothing** → the workbench already
reports declaration gaps when it lays out a baseline, and an unusable part is dropped rather than
used, so the navigation target is one the layout accepted.

**The demo depends on this change** → the demo workspace is held rather than worked around, so no
second mechanism is invented in the product to compensate for a platform gap.
