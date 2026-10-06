## Context

A surface action naming a command is part of the published 0.16.0 contract. The header draws it,
hides it while the session may not run the command, and offers its menu where it declares one. The
demo pins the published packages, so it can adopt this without waiting for the next release.

## Goals / Non-Goals

**Goals:**

- Each of the five actions exists once, as a command, and is drawn by the platform.

**Non-Goals:**

- Letting other demo plugins fill these headers. That needs the unreleased toolbar slot and belongs
  after the next release.

## Decisions

**Per view, the action moves to the header unless the view's purpose is the action itself.** The
decision and its reason are written here before implementation; a view that keeps a body button keeps
it by running the same command through the command service, not the module helper.

**The five, decided.** All five move to the header, because in each view the list is the purpose and
the action is an operation on it:

| View | Action | Decision |
|---|---|---|
| Customer list | New customer | Header. The body keeps its search field; creating is an operation beside the list, not the list. |
| Payroll runs | Run payroll | Header. The view reads past runs; starting the next one is an operation on them. |
| Dunning | Start dunning run | Header. The view lists what is overdue; the run raises it, and asks first. |
| Stock levels | Post stock count | Header. The view shows levels and what is below its reorder point; the count posts against it. |
| Purchase orders | Post goods receipt | Header. The view lists what is on order; the receipt books the next delivery. |

None keeps a body button, so none needs the command service in its component.

**Each action has an icon of its own.** The commands carried their module's icon, which the view's
tab already shows; an action drawn with the same picture as the tab beside it says nothing. Each
command now carries the icon its action draws, so the palette shows the same picture as the header.

## Risks / Trade-offs

- [An icon action is less discoverable than a labelled button] → The action carries the command's
  title as its tooltip and accessible name, and its shortcut where it has one.
