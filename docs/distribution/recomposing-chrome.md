# Recomposing host chrome

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `platform-composition` · `commands` · `routing`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The shell seeds default chrome (theme toggle, language switcher, version, update badge). A
distribution can:

- **Replace** a default: register your own contribution with the **same id** (last-in wins).
- **Hide** a default: `provideShell({ omit: ['shell.language'] })`.
- **Move** a default: re-register it with the same id at the new spot.

Replace and move use the same mechanism, and a distribution does it **without a plugin**: the
`provideViews` / `provideRailItems` / `provideBarItems` providers register chrome directly (see
[Contributing chrome without a plugin](../distribution-api/composition.md#do-it)). A product that
wants the update badge in the right sidebar's footer bar moves it exactly like this:

```ts
// src/app/app.config.ts — in the providers array
import { UpdateBadge, provideBarItems } from '@loomweaver/shell';

// in the bootstrap providers — same id as the seeded default, so it relocates instead of duplicating:
...provideBarItems({
  id: 'shell.update',
  bar: 'right-footer', // a bar region declared in your provideLayout
  slot: 'end',
  component: UpdateBadge,
}),
```

## Command palette entry

The command palette is always reachable by shortcut (`mod+k`), but the shell places **no visible
entry** in the top bar. `provideCommandPaletteEntry()` adds one: a badge-styled affordance (search
icon + the palette's OS-correct shortcut, ⌘K / Ctrl+K) that opens `shell.commandPalette`,
correct-by-construction and without a distribution component:

```ts
// src/app/app.config.ts — in the providers array
provideCommandPaletteEntry();                             // top bar, end slot, order 5 (default)
provideCommandPaletteEntry({ slot: 'start', order: 1 });  // …or place it yourself
provideCommandPaletteEntry({ bar: 'status-bar' });        // …or in a status bar
```

The badge **adapts to the bar it lands in**, because bars are not the same shape: a top bar is a
fixed band, so there the entry pins the shared bar-control height and lines up with the theme and
language controls beside it. A bottom bar takes the height of its tallest item, so there the entry
renders like a plain bar item. Otherwise it would grow the bar and quietly take that height off the
content area.

It uses the bar-item id `shell.commandPaletteEntry`, so `provideShell({ omit:
['shell.commandPaletteEntry'] })` removes it again. To show a shortcut anywhere else yourself,
`formatChord` renders it the way the shell does: see [Commands](../distribution-api/commands.md#in-depth).

`provideQuickOpenEntry()` is the same badge for the other search, `shell.quickOpen` (`mod+p`). It
defaults to the **status bar's leading edge** rather than the top bar, deliberately: two identical
search badges side by side read as a duplicate rather than as two different things. Its bar-item id
is `shell.quickOpenEntry`. The two are independent, so a product may place either, both or neither,
and may put each wherever it likes:

```ts
provideCommandPaletteEntry();                            // top bar, end slot, order 5 (default)
provideQuickOpenEntry();                                 // status bar, start slot, order 5 (default)
provideQuickOpenEntry({ bar: 'top-bar', order: 4 });     // …or beside the other one after all
```

**A badge never outlives what it opens.** Omit `shell.commandPalette` or `shell.quickOpen` and its
badge goes with the command, as does the chord; the same happens where the session does not meet the
command's `access`, and in a pop-out window, which offers no quick-open at all. You are never left
with a control that warns to the console and does nothing. Switching the shortcut layer off with
`provideShellFeatures({ commands: { shortcuts: false } })` is the one exception: the badge stays and
still opens the search, it simply prints no chord, because nothing here advertises a key that does
nothing.

Rebinding one of the two chords to a command of your own has **two** supported ways, and one trap.
Register your command under the built-in id (`shell.commandPalette`) and it replaces it, inheriting
its place everywhere; or `omit` the built-in and declare `shortcut: 'mod+k'` on a command of your
own. What not to do is declare the chord on your own command while the built-in one is still
registered: two commands then hold one chord, the shell warns in the console, and the later
registration wins. That is a registration order your composition root does not control.

The palette and quick-open are one component in two modes, and both are host commands, so `omit`
and rebinding work the usual way; what each lists is in [Commands](../distribution-api/commands.md#in-depth).

This covers **built-in menu entries** too: every standard entry carries the id
`menu:<commandId>`. For example, `omit: ['menu:shell.tab.closeAll']` hides "Close all" from the tab
context menu while the command itself (palette, shortcuts) stays available; omit the command id as well to
remove the behaviour entirely. Registering a menu item with an existing id replaces that entry.
Tab menu: `menu:shell.tab.splitRight/.splitDown/.close/.closeOthers/.closeRight/.closeAll/.togglePin` ·
view menu: `menu:shell.view.moveToOtherSidebar/.stackBelow/.openInContent/.resetState`.

A menu entry whose `command:` id no longer resolves (you omitted the command, or it was never
registered) is **hidden**, not rendered as its raw id, so omitting a bare command id cleanly removes
it from the palette **and** the menu at once, rather than corrupting the menu entry.

The host's own **context-only** commands (`shell.tab.*`, `shell.view.*`: close / close-others /
split / stack / reset / …) are marked `paletteHidden`, so they never appear in the command palette
(they need a tab/view context the palette can't supply). Your weaver can set `paletteHidden` on its
own context-only commands the same way. A separate axis: commands are main-window-only by default and
declare `popout: true` to appear in a [pop-out window](windows-and-sync.md#pop-out-windows).

## Curating the settings surface

`omit` covers **settings** too, so a distribution decides which settings its app shows. Settings are
addressed with a **`setting:` prefix**: a _section_ id drops the whole section, a _row_ id drops just
that row, and a section that omission leaves without rows disappears from the nav:

```ts
// src/app/app.config.ts — in the providers array
provideShell({
  omit: [
    'setting:shell.permissions', // drop the whole built-in Permissions section
    'setting:shell.textSize',    // …or just one row, keeping General's theme + language
  ],
});
```

The prefix is deliberate (same reason built-in menu entries carry `menu:<commandId>`): a chrome id and
a settings id may coincide. `shell.language` is **both** the top-bar item and the General settings
row, so `omit: ['shell.language']` stays chrome-only and never silently strips the setting too. To
remove both, list both: `['shell.language', 'setting:shell.language']`.

Built-in settings ids: section `setting:shell.general` (rows `setting:shell.theme`,
`setting:shell.language`, `setting:shell.textSize`) and section `setting:shell.permissions`
(row `setting:shell.pluginPermissions`). Registering a section with an existing id **replaces** it
(last-in wins), so you can swap a built-in section for your own.

`omit` is a **lasting** filter: an id a plugin registers later at activation time stays hidden too.
(To _replace_ a default rather than hide it, register your own contribution with the same id and do
**not** omit it.)

## Dropping a content route

A **routable** surface's route is omitted with a `route:` prefix and the **surface id**:

```ts
// src/app/app.config.ts — in the providers array
provideShell({ omit: ['route:acme.notes.archive'] }); // a surface one of your weavers ships and this app does not want
```

The route then appears in no tab strip, no pane target picker, and is never auto-opened on a deep-link.
Its URL still answers with the host's neutral _"View not available"_ placeholder, so a link shared from
another environment explains itself instead of silently bouncing to home. (Like the auth placeholder, it
covers the route's tab root; a deep-link into a _sub-route_ of an omitted route falls back to home.)

Two things worth knowing:

- **Omit addresses the id, override addresses the path.** Two handles for two operations: `omit:
['route:acme.notes.archive']` drops the route, while registering _your own_ surface on the same `path`
  replaces it (last-in wins). Use that when you want your own view at that URL rather than nothing.
  Read the id off the surface's `registerSurface` call; **do not guess it from the URL**. They often
  differ: a sandboxed plugin conventionally declares surface id `<pluginId>.view` while routing at
  `<pluginId>`, so the view at `/charts` is dropped with `route:charts.view`.
- **A route is not its triggers.** A rail item or command that navigates there is a _separate_
  contribution with its own id; omitting the route leaves it drawn (and dead). List them too.

## Where next

- [Commands](../distribution-api/commands.md): running and inspecting commands from your own code.
- [Settings](../distribution-api/settings.md): adding and hiding settings sections from your own code.
- [Switching capabilities off](switching-capabilities-off.md): removing a gesture rather than a contribution.
