## Context

Two parties put workspaces in front of the user, and they are not interchangeable. The workbench
offers the ones the user saved: it invents their appearance, because a saved workspace has only a
name the user typed, and a marker derived from that name is the most it can honestly draw. The
product offers the ones it declared: it knows what they are for, so it names them and gives them an
icon. The service that draws the first kind already watches both the rail and the workspaces, which
is why the second kind's absence can be noticed there and nowhere cheaper.

## Goals / Non-Goals

**Goals:**

- Tell a developer, once and by name, about a declared workspace nothing offers.
- Say it where it is already said for the other declaration mistakes: the console, in development.

**Non-Goals:**

- Offering the workspace automatically. The product's entry carries an icon, a rail and an order the
  workbench cannot invent, and a marker derived from a declared workspace's name would be a worse
  answer than the icon the product would have given it.
- Refusing the composition. A workspace reachable only through the dialog works; it is a shortcoming
  in what the product offers, not an unusable declaration.
- Reporting anything in production. This is for whoever composes the distribution.

## Decisions

**The check runs once, after the first render.** Entries arrive from two directions — the
composition's own `provideRailItems` and the plugins it composes, which register during activation —
so anything that looks earlier would report a plugin's entry as missing and be wrong. After the
first render both have happened. A plugin installed later could still add one; the diagnostic is
aimed at whoever composes a distribution, and being late for a runtime install is better than being
wrong at boot.

*Alternative rejected:* a reactive check that re-evaluates whenever the rail changes. It would be
correct at every instant and would say the same thing repeatedly while the user curates the rail,
and suppressing the repeats costs more than the timing question it solves.

**A workspace counts as offered when something switches to it, whatever that something is.** The test
is an entry naming the workspace, not an entry in a particular rail — a product may put it in a
second rail, and a user may have hidden it. Hiding is a choice, not a defect, and the entry is
restorable from the customization the user hid it in.

**The message names the workspace and what is left.** The other diagnostics say what will happen —
"the tab renders a placeholder", "the entry has no effect" — rather than what to type. This one says
the workspace is reachable only through the dialog, which is both the symptom and the reason it
matters.

## Risks / Trade-offs

**A product that deliberately offers a workspace only through a command would be told about it** →
it is told once, in development, and nothing stops it. The alternative is a flag to silence a
diagnostic, which is more surface than the case is worth; if one ever appears in practice, the flag
can be added then.

**The demo's console-quiet end-to-end case will fail for any workspace shipped without an entry** →
that is the intent, and it is why this change is worth more than the guide sentence alone.
