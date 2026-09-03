# Panes

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `panes` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The arrangement side of the content area: the panes your tabs sit in.

## Do it

```ts
const panes = inject(PaneService);

panes.splitRight();            // duplicate what the address pane shows, like the toolbar button
panes.splitDown(handle);
panes.closePane(handle);       // asks about unsaved work exactly as the × would
panes.unsplit();               // back to one pane; asks if a sibling holds unsaved work
panes.maximize(handle); panes.minimize(handle); panes.restore(handle);
panes.focus(handle);           // move the address to that pane
panes.moveTab('doc/readme', handle);
```

## Read it

```ts
panes.panes();                 // PaneFacts[] in layout order: handle, showing, itemCount, …
panes.activePane();            // the handle of the pane carrying the address
panes.isSplit();               // Signal<boolean>
panes.maximized();             // PaneHandle | null
panes.minimized();             // readonly PaneHandle[]
panes.exists(handle);          // whether the handle still names a pane
```

Every pane of the content area is listed by `panes()`, in layout order, as `PaneFacts`: `handle`, `showing` (the path shown, or `null`), `itemCount`, `carriesAddress`, `maximized`, `minimized`. The handle of the pane carrying the address is `activePane()`. The area as a whole is answered by `isSplit()`, `maximized()` and `minimized()`. Nesting and proportions are not published: bind your own controls to these signals and they follow the user.

```ts
@if (panes.isSplit()) { <button (click)="panes.unsplit()">Single pane</button> }
```

## What asks about unsaved work

`closePane` asks about the unsaved work of the pane it closes, exactly as the pane's × would. `unsplit` asks for every sibling pane it drops. Splitting never asks: it does nothing when what the pane shows cannot be shown in a second pane.

## Switched off

`content.splitRight`, `content.splitDown`, `content.maximize`, `content.minimize` and `content.close` take the toolbar buttons, the drop edges and `mod+\\` away from the user. Every action here keeps working for you, which is how you offer it from your own control.

## In depth

**Two services, one boundary.** Content is `ContentTabsService`: which items are open, which is
active, opening, navigating, pinning, closing an item. Arrangement is `PaneService`: the panes those
items sit in, splitting, closing a pane, filling the area, collapsing, where the address lives.
Neither knows the other's job.

**Handles.** An action takes a `PaneHandle`, which the facts hand you. A handle is opaque and
stable for as long as its pane exists: it survives focus changes, splits elsewhere and restarts, so
you may keep it. Once the pane is gone the handle names nothing, and every action given it does
nothing rather than acting on another pane. Without a handle an action means the pane that carries
the address, which is what a toolbar on that pane means too.

**Same code as the controls.** Each action is the one the pane toolbar, the tab menu and the
`shell.content.splitRight` chord run, with the guards listed under *What asks about unsaved work*.
The switches do not reach the service, as *Switched off* says.

**Facts, not the tree.** The signals under *Read it* tell you what exists and what each pane shows.
Nothing else about the tree is published.

**Scope.** `PaneService` addresses the content area. Panes inside sidebars are not reachable through
it.

## Where the story is told

- [Tabs](tabs.md): the content side of the same area.
- [Switching capabilities off](../distribution/switching-capabilities-off.md#switching-capabilities-off): what the toolbar offers and how to take it away.
