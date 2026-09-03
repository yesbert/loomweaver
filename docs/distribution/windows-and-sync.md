# Windows and sync

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `popout-windows` · `persistence-ports`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

State the workbench keeps can be mirrored live across same-origin windows, and any surface can be shown in a browser window of its own. Neither needs wiring; this page says what each does and where the product hooks in.

## Cross-tab live sync

Whatever store is in place, the shell wraps it so every write broadcasts its **key** to the app's
other browser windows of the same origin, and a window that has registered a reaction for that key
reads the fresh value back through the store and applies it. Only the key travels, so
the store stays the single source of truth — this works with a network-backed store just as well as
with `localStorage`.

It is on by default and needs no wiring. The shell registers its own keys, so **theme, language,
text size, installed and disabled plugins, capability revocations, plugin settings, view state and
view instances, saved workspaces and the user's rail curation follow across windows live**. Plugins
inherit that for free: their state lives in host-managed stores. **Layout keys are deliberately not
synced** — `lw.shell.pane-trees:<workspaceId>`, `hidden-views:<workspaceId>`, `panel-sizes`,
`panels`, `active-workspace` and `item-order` stay per window,
because two windows are meant to be able to show different layouts.

A distribution registers its own keys the same way. The most useful one is your session key: when
it changes, the other window's `AuthSnapshot` flips and the `onIdentityChange` policy above takes
over — no auth-specific sync machinery.

```ts
// src/app/app.config.ts — in the providers array
import { inject, provideEnvironmentInitializer } from '@angular/core';
import { StateSyncService } from '@loomweaver/shell';

// in the bootstrap providers array; mySession is YOUR OWN session service —
// reload()/onChange() stand in for whatever refresh/subscribe API it has:
provideEnvironmentInitializer(() => {
  const sync = inject(StateSyncService);
  // React to a remote write. The first argument names where the fresh value is read back from:
  // 'settings' / 'working-state' for keys on the ports, 'external' for state persisted elsewhere
  // (the applier then receives undefined and re-reads its own storage).
  sync.register('external', 'my.product.session', () => mySession.reload());
  // State persisted OUTSIDE the ports (a product session store usually is) must announce itself
  // when you write it — nothing else can know.
  mySession.onChange(() => sync.announce('my.product.session'));
}),
```

The same two hooks generalise to a **trusted weaver** that persists its own storage outside the
ports: the weaver exposes `{ key, refresh }` plus a way to receive `announce`, and the distribution
wires them exactly like the session key above — the testbed does this for its theme toggle and its
auth stub. The complete recipe, including the which-store decision table, is
[recipe 9 in Samples](../samples.md#sync-your-own-state-across-browser-windows).

A backend with a push transport rings the same bell for its **own** window:
`sync.notifyRemoteChange(key)` runs the registered applier locally, reading the fresh value back
through the registered store — that is the live tier of a cross-device working-state store.

An applier must set its state **without persisting again**, or two windows would write back and
forth forever.

## Pop-out windows

Any content tab or sidebar view can be opened in its **own browser window** — for a second monitor —
from its context menu ("Open in new window"). The pop-out boots the same app from a `/popout/…` URL
and renders exactly **one** surface: no rail, no sidebars, no pane tree. Theme, text size, dialogs,
toasts, permissions and auth all work as usual, because it is the same app.

It **duplicates** rather than moves: the original tab stays in the main window. The two windows share
one view-state instance, so they mirror each other live through the sync above. The pop-out **never
writes layout keys** — the main window stays the only layout writer — and the layout-mutating host
commands are not registered there. It also closes **without the unsaved-changes ask**: the
retention/dirty protocol guards the main window, so treat a pop-out as a viewer onto the
shared state rather than the place where unsaved work lives.

**A pop-out only offers what belongs beside a single surface.** It has one surface and no tab strip,
so **Quick-Open does not exist** in it: `shell.quickOpen` is not registered and `mod+p` does nothing.
The command palette stays, but commands are **main-window-only by default** and reach a pop-out only
by declaring it:

```ts
// src/notes/notes.plugin.ts — inside activate(ctx)
ctx.registerCommand({
  id: 'notes.about',
  title: 'notes.about',
  icon: 'help',
  popout: true,             // belongs beside a single surface
  run: () => ctx.ui.open(AboutDialog),
});

ctx.registerCommand({
  id: 'notes.focusList',
  title: 'notes.focusList',
  icon: 'navigator',        // no popout: needs the sidebar, which a pop-out has none of
  run: () => ctx.revealSurface('notes.list'),
});
```

The quiet default is deliberate. A command **missing** from a pop-out is a small annoyance, while one
that does something surprising in a detached window is the larger failure, and the shell cannot tell
the two apart for a command it did not write. So it never guesses: it marks its own two (the palette
and Settings) and leaves the rest to you.

`popout` flows through the one seam every trigger uses, so an unmarked command is omitted from the
palette, its keybinding no-ops and a UI item bound to it does nothing.

As a backstop, **content navigation is refused in a pop-out** (with a dev-mode warning) whether or not
a command is marked. Without that, one navigation would take the window's address out of `/popout/…`
and it would quietly stop being a pop-out: chrome-less until the next reload, and the full app after
it. Same reasoning as a docked surface, whose `navigate` is a no-op for want of a content area.

Nothing is required from a distribution or a plugin: the entries appear by themselves, and
`/popout/view/<viewId>` works for every registered view. To open one programmatically:

```ts
// src/app/… — inside an injection context (a component or a service)
import { PopoutService } from '@loomweaver/shell';

inject(PopoutService).open('view:my.outline');   // or a content path: 'doc/42'
```

If the browser's pop-up blocker swallows the window, the host shows a dialog whose button is a fresh
user gesture and retries.

A surface that draws its own sub-tabs should switch them **locally when it is host-mounted** rather
than navigate the global router — otherwise a pop-out's URL drifts out of the `/popout/` prefix and
reloading that window opens the full app. The rule is one line and applies to splits too; see
[authoring a weaver](../weaver/containers.md#sub-routes-and-pop-out-windows).

## Where next

- [Building a distribution](../building-a-distribution.md): the composition root and the map of these pages.
- [Distribution API](../distribution-api/index.md): everything your own code can do once the product runs.
