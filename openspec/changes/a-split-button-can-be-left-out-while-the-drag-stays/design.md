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

### `boolean | { button?: boolean }`, on `splitRight` and `splitDown` only

```ts
{ content: { splitRight: { button: false } } }
```

The object says: the capability stays, the pane toolbar's button for it is not drawn. `false` keeps
its meaning, `true` keeps its meaning, and an object that says nothing means the same as `true`.

Rejected: the finding's `{ button, dropEdge, shortcut }`. Two of those three routes already have a
handle, and a second one would let a distribution remove the same entry in two places, which is how
two answers to one question start disagreeing.

Rejected: a separate `splitButtons` switch. It would bundle two capabilities' affordances into one
decision, and the contract states outright that there are no bundles of switches.

Rejected: giving the fixed chrome an identity so `omit` could reach it. That would make `omit` the
tool for chrome the workbench draws, which is a far larger promise than this needs, and every other
gesture's affordance would then want one.

### The reading side stays boolean

`FeatureSwitches` keeps answering `splitRight()` as a boolean: the capability is on or off, which is
what every existing reader asks. The button's question is its own, answered beside it. So no reader
changes except the two that draw the button, and a distribution that turns a switch on and off at
runtime keeps doing it with `true` and `false`.

The declared finer form belongs to the declaration, so a runtime change that passes a boolean sets
the capability and leaves the declared button decision standing. That is the same rule the group
merge already follows: naming part of a group leaves the rest alone.

## Risks / Trade-offs

- **A union where readers expect a boolean.** `ShellFeaturesInput` is `Partial<...>` over the group,
  so the union has to be accepted where a distribution declares and normalised once on the way in. →
  Normalise at the boundary, in the merge, and keep every internal reader boolean; the tasks pin it
  with a test that reads the switch after a partial override.
- **An invited next key.** Someone will ask for `dropEdge` next. → The spec states the rule that
  admits a key: only a route with no handle of its own. The answer to `dropEtge` is that switching
  the capability off is that decision.
- **Two ways to reach one outcome.** A product could remove the button and also omit the command,
  and wonder which did what. → They are different routes, not different handles for one route, which
  is exactly the distinction the written contract now states in one place.
