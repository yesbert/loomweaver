## Context

See proposal.md, *Why*. What the routes are, verified in the shipped code:

| route | where it is decided | handle today |
|---|---|---|
| pane toolbar button | `pane-view.ts` `canSplitRight`, `content-area.ts` `canSplitRight` | none |
| drop edges | `pane-drop-zones.ts`, and `content-area.ts` `tabsDraggable` | the switch |
| `shell.content.splitRight` + `mod+\` + palette row | `shell-seeds.ts`, behind `whileOn` | `omit: ['shell.content.splitRight']` |
| tab menu entry | `tab-context-menu.ts` | `omit: ['menu:shell.tab.splitRight']` |
| `shell.tab.splitRight` | `tab-context-menu.ts` | `omit: ['shell.tab.splitRight']` |

`ShellOptions.omit` covers every contribution kind, chrome by bare id and the other kinds by prefix,
and it is a lasting filter rather than a one-time delete. Splitting downwards has the same routes
except the shortcut: there is no `shell.content.splitDown`.

## Goals / Non-Goals

**Goals:**

- One handle for the one route that has none.
- The plain boolean unchanged, in meaning and in shape.
- The three handles stated together where a distribution reads about switches.

**Non-Goals:**

- A route matrix. No `dropEdge`, no `shortcut`, no `menu` key, now or as a placeholder.
- Making the toolbar button follow the command's registration. Tempting, and wrong: the command
  toggles the content area's split while the toolbar button splits this pane and duplicates what it
  shows, which `panes` guarantees as its own requirement. They are two behaviours, not one behaviour
  with two triggers, and `splitDown` has no command at all.
- Touching what splitting does, or the defaults.

## Decisions

### Two switches of their own, not a union on the existing two

```ts
provideShellFeatures({ content: { splitRightButton: false } });
```

`ContentFeatures` gains `splitRightButton` and `splitDownButton`, both on by default. Each says: the
capability stays, the pane toolbar's button for it is not drawn. A consumer reads them the way it
reads every other switch, `switches.content.splitRightButton()`, and changes them the way it changes
every other one.

**This departs from the shape the finding asked for, and from the shape this change first proposed**
(`splitRight: boolean | { button?: boolean }`). The union looked tidier and cost more than it was
worth. Every mechanism around a switch is built on "a group of booleans under their own names":
`mergeShellFeatures` spreads, `FeatureSwitches.group` maps each key to a `Signal<boolean>`,
`SwitchSignals<Group>` types it, `ShellFeaturesInput` is a `Partial` of each group. A union would
have needed a normalising step on the way in, a second internal shape to read from, and a name to
read the button by that is not the name it was declared with — which breaks the rule that the same
name declares, switches and reads. Two plain switches need none of that: nothing in the merge, the
service or the input type changes at all.

It also keeps the runtime story simple. `update({ content: { splitRight: false } })` sets the
capability and leaves the button switch standing, and either can be changed alone, which is what
naming part of a group has always meant.

Rejected: the finding's `{ button, dropEdge, shortcut }`. Two of those three routes already have a
handle, and a second one would let a distribution remove the same entry in two places, which is how
two answers to one question start disagreeing.

Rejected: a single `splitButtons` switch for both. It would bundle two capabilities' affordances
into one decision, and the contract states outright that there are no bundles of switches.

Rejected: giving the fixed chrome an identity so `omit` could reach it. That would make `omit` the
tool for chrome the workbench draws, which is a far larger promise than this needs, and every other
gesture's affordance would then want one.

### The capability still wins

The button is drawn where the capability is on **and** its own switch is on. So switching splitting
off removes the button whatever the button switch says, which is what `gesture-configuration`
requires, and a product cannot accidentally leave a control behind that reaches a capability it
switched off.

## Risks / Trade-offs

- **Two more names in the switch set.** A reader of `ContentFeatures` now meets four split switches
  rather than two. → They sit next to each other, the two new ones are named for what they leave
  out, and their contract comments say which routes they do not touch and where those are handled.
- **A product could read `splitRightButton: true` while splitting is off and be puzzled.** → The
  resolution is stated in the contract comment and pinned by a test: the capability wins.
- **The testbed sat on its bundle ceiling.** Two switches and two reads take the initial bundle from
  894.7 kB to 895.0 kB, which is over a ceiling of 895. → The growth is meant and tiny, so the
  ceiling is raised to 900 with the guard's own `--write-baseline` rather than the capability being
  trimmed to fit a rounding step.
- **An invited next switch.** Someone will ask for a drop-edge switch next. → The spec states the
  rule that admits one: only a route with no handle of its own. A drop edge is not that, because
  switching the capability off is the decision that removes it.
- **Two ways to reach one outcome.** A product could remove the button and also omit the command,
  and wonder which did what. → They are different routes, not different handles for one route, which
  is exactly the distinction the written contract now states in one place.
