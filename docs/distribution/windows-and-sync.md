# Windows and sync

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `popout-windows` · `persistence-ports`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

State the workbench keeps can be mirrored live across same-origin windows, and any surface can be shown in a browser window of its own. Neither needs wiring; this page says what each does for the user and where the product hooks in.

## Cross-tab live sync

Whatever store is in place, the shell wraps it so every write broadcasts its **key** to the app's
other browser windows of the same origin, and a window that has registered a reaction for that key
reads the fresh value back through the store and applies it. Only the key travels, so
the store stays the single source of truth. This works with a network-backed store just as well as
with `localStorage`.

It is on by default and needs no wiring. The shell registers its own keys, so **theme, language,
text size, installed and disabled plugins, capability revocations, plugin settings, view state and
view instances, saved workspaces and the user's rail curation follow across windows live**. Plugins
inherit that for free: their state lives in host-managed stores. **Layout keys are deliberately not
synced**: `lw.shell.pane-trees:<workspaceId>`, `hidden-views:<workspaceId>`, `panel-sizes`,
`panels`, `active-workspace` and `item-order` stay per window,
because two windows are meant to be able to show different layouts.

A distribution registers its own keys the same way. The most useful one is your session key: when
it changes, the other window's `AuthSnapshot` flips and the `onIdentityChange` policy in
[Auth integration](auth.md) takes over, with no auth-specific sync machinery. Registering a key,
announcing a write made outside the ports, and applying a change your backend pushed are the three
calls on `StateSyncService` under [Windows, sync and updates](../distribution-api/windows-and-sync.md#do-it).

This page owns what follows by itself and what stays per window.
[Sync your own state across browser windows](../samples.md#sync-your-own-state-across-browser-windows)
is the worked sample: a session key, a backend push and a weaver that persists outside the ports,
with the table that decides which store a piece of state belongs in.

## Pop-out windows

Any content tab or sidebar view can be opened in its **own browser window** from its context menu
("Open in new window"), which is how a surface reaches a second monitor. The pop-out boots the same
app from a `/popout/…` URL and renders exactly **one** surface: no rail, no sidebars, no pane tree. Theme, text size, dialogs,
toasts, permissions and auth all work as usual, because it is the same app.

It **duplicates** rather than moves: the original tab stays in the main window. The two windows share
one view-state instance, so they mirror each other live through the sync above. The pop-out **never
writes layout keys**: the main window stays the only layout writer, and the layout-mutating host
commands are not registered there. It also closes **without the unsaved-changes ask**: the
retention/dirty protocol guards the main window, so treat a pop-out as a viewer onto the
shared state rather than the place where unsaved work lives.

**A pop-out only offers what belongs beside a single surface.** It has one surface and no tab strip,
so **quick-open does not exist** in it: `shell.quickOpen` is not registered and `mod+p` does nothing.
The command palette stays, but commands are **main-window-only by default**: a command reaches a
pop-out only when its author declares `popout: true` on it.

The quiet default is deliberate. A command **missing** from a pop-out is a small annoyance, while one
that does something surprising in a detached window is the larger failure, and the shell cannot tell
the two apart for a command it did not write. So it never guesses: it marks its own two (the palette
and Settings) and leaves the rest to the command's author. An unmarked command is omitted from the
pop-out's palette, its keybinding no-ops and a UI item bound to it does nothing.

As a backstop, **content navigation is refused in a pop-out** (with a dev-mode warning) whether or not
a command is marked. Without that, one navigation would take the window's address out of `/popout/…`
and it would quietly stop being a pop-out: chrome-less until the next reload, and the full app after
it. Same reasoning as a docked surface, whose `navigate` is a no-op for want of a content area.

Nothing is required from a distribution or a plugin: the entries appear by themselves, and
`/popout/view/<viewId>` works for every registered view. Opening one from your own code is
`PopoutService` in [Windows, sync and updates](../distribution-api/windows-and-sync.md#do-it).

A surface that draws its own sub-tabs must switch them locally while it is host-mounted, or a
pop-out's URL drifts out of the `/popout/` prefix and reloading that window opens the full app. The
rule and its one-line test are in
[Sub-routes, the rest, and tabs that follow](../weaver/sub-routes-and-follows.md#sub-routes-and-pop-out-windows).

## Where next

- [Windows, sync and updates](../distribution-api/windows-and-sync.md): pop-out windows and cross-window state from your own code.
- [Persistence stores](persistence.md): the stores whose writes are mirrored.
- [View state that survives](../weaver/view-state.md): what a surface keeps when it is shown in a second window.
