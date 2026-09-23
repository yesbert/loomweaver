# Menus

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `menus`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

A menu is a named slot the host draws and anything may contribute to. This page adds an item to a host
menu and gives a rail or bar item a menu of its own. It then opens that menu on the plain click, for an
account entry with a picture, opens a menu on your own view body, and draws a menu inside your own
sandboxed surface.

## Items in a host menu

Add an item to a host menu slot with `ctx.registerMenuItem` (capability `contributions`).
It names a {@link Command} by id (invoked with the menu's context) and may declare a coarse `when`
filter. The item shows only when every `when` key equals the same key in the opener's context. The
host draws the menu. A right-click on a content tab opens the `content/tab/context` slot, in the
address-carrying pane and in any split pane of the main area alike. The context is
`{ targetKind, tabId, paneId, primary, pinned, closable, sole }`. `paneId` names the pane the tab stands
in, `primary` says that pane carries the address, and `sole` says the tab is the only one in its pane:

```ts
ctx.registerCommand({ id: 'my.tab.reveal', title: 'my.tab.reveal', run: (ctx) => reveal(ctx?.tabId) });
ctx.registerMenuItem({ menu: 'content/tab/context', command: 'my.tab.reveal', group: '3_plugin', when: { closable: true } });
```

The host's own tab actions (Close, Close Others/All/to-the-Right, and a "Pinned" checkbox) live in the same
slot, and your item joins them, in every pane of the main area. The host's entries act on the pane named
in the context. An entry of your own that belongs only to the address-carrying pane declares
`when: { primary: true }`. The two split entries take the tab out of its pane into a new one. They are
offered only while other tabs share the pane, through `when: { sole: false }`. The pane toolbar's split
duplicates the open item instead, and is the way to split a lone tab. Use the same condition on an entry of
your own that would leave the pane empty. Command behaviour crosses the sandbox boundary because it is referenced by
**id** (the context is plain, serialisable data); an inline `run` on a menu item is trusted, in-process only.

![The context menu of a content tab, offering Split right, Split down, Close, Close Others, Close to the Right, Close All, Pinned and Open in New Window.](../../assets/media/tab-menu-light.png#gh-light-mode-only)

![The context menu of a content tab, offering Split right, Split down, Close, Close Others, Close to the Right, Close All, Pinned and Open in New Window.](../../assets/media/tab-menu-dark.png#gh-dark-mode-only)

The host's menu on a content tab. Your item joins this slot beside the host's own actions.

![The context menu of a rail entry, offering to move the entry to the other rail or to hide it.](../../assets/media/rail-menu-light.png#gh-light-mode-only)

![The context menu of a rail entry, offering to move the entry to the other rail or to hide it.](../../assets/media/rail-menu-dark.png#gh-dark-mode-only)

The host's menu on a rail entry, and the same slot for an entry that declares a menu of its own:
the host's _Hide_ is added to it rather than replacing it.

A menu item may carry its own optional `id`: re-registering that id **replaces** the entry (last-in wins),
the same rule as every other contribution. The built-in entries use `menu:<commandId>` ids
(e.g. `menu:shell.tab.closeAll`), so a distribution can hide or swap a standard entry.
[Building a distribution](../building-a-distribution.md) shows how. Without an `id` your item is
purely additive.

A menu item shows its referenced command's **icon** and **keyboard-shortcut** hint automatically. Add
`checkedWhen` to make it a **checkbox** (`role="menuitemcheckbox"`): it is checked when `checkedWhen` is a
subset of the opener's context, so one toggle item replaces a Pin/Unpin pair (the command reads the state
from the context and flips it). A checkbox item keeps its command's icon: the check has a leading place
of its own and the icon follows it, so a menu of modes that each have a symbol can still mark the one in
effect. A menu without any checkbox reserves no space for the check, and one without icons none for those.

```ts
ctx.registerCommand({
  id: 'my.tab.togglePin',
  title: 'my.tab.pinned',
  // `context` is optional and its values are `string | number | boolean` — narrow before use.
  run: (c) => {
    const tabId = String(c?.['tabId'] ?? '');
    if (!tabId) return;
    if (c?.['pinned']) unpin(tabId);
    else pin(tabId);
  },
});
ctx.registerMenuItem({ menu: 'content/tab/context', command: 'my.tab.togglePin', when: { closable: true }, checkedWhen: { pinned: true } });
```

## Item-attached menus (any region)

A context menu is not tied to the tab strip: a `RailItem`,
`BarButtonItem` or `ViewAction` can carry a `menu?: string` slot, and the host opens it on right-click with a
`{ targetKind, id, region }` context. Contribute items to that slot the same way; e.g. the
built-in view-tab menu offers "Move to other sidebar". One mechanism, every region.

A view's tab opens `panel/view/context` with `{ targetKind: 'view-tab', viewId, region, inContent, sole }`
wherever the tab stands, in a sidebar or in a pane of the main area. `inContent` says the tab stands in
the main area. The built-in "Open in content" and "Move to other sidebar" carry `when: { inContent: false }`,
because neither has anywhere to go from there. "Stack below", "Reset view", "Open in new window" and "Hide"
are offered everywhere. An entry of your own that takes the view somewhere can use the same condition.

## A menu on the plain click

A `RailItem` or a `BarButtonItem` may add
`menuTrigger?: MenuTrigger` to say which gesture opens its slot: `'context'` (the default, the
right-click above), `'primary'` or `'both'`. With `'primary'` or `'both'` the menu opens when the
item is activated, by click, Enter or Space alike, anchored beside the control the host drew and
flipped to its other side rather than covering it. That is the account entry a workbench with a
signed-in user needs:

```ts
ctx.registerRailItem({
  id: 'notes.account', rail: 'primary', anchor: 'bottom', icon: 'user', initials: 'AR',
  title: 'notes.account.title', menu: 'notes.account/menu', menuTrigger: 'primary',
});
ctx.registerMenuItem({ menu: 'notes.account/menu', command: 'notes.signOut', group: '9_session' });
```

Add `menuHeader: { title, detail?, icon?, initials? }` and the host draws a heading above the first
entry, which is where the name belongs when the control itself is a two-letter badge:

```ts
ctx.registerRailItem({
  id: 'notes.account', rail: 'primary', anchor: 'bottom', icon: 'user', initials: 'AR',
  title: 'notes.account.title', menu: 'notes.account/menu', menuTrigger: 'primary',
  menuHeader: { title: displayName, detail: emailAddress, initials: 'AR' },
});
```

Without a command the heading is not an entry: nothing activates it, and the arrow keys pass over it the way they pass
over a separator. The menu is announced by what it names, so the name reaches the user once rather
than twice. A menu opened at the pointer carries none, because what it acts on is under the pointer.

Give the heading a `command` and it leads to what it names, the way a click on the person in an
account menu opens their profile:

```ts
menuHeader: { title: displayName, detail: emailAddress, initials: 'AR', command: 'notes.profile' },
```

The heading is then the menu's first entry. The down arrow reaches it first, a click, Enter or Space
runs the command with the menu's context and closes the menu, and it looks like an entry under the
pointer. A screen reader still hears the name once, on the menu, and hears the heading by the
command's title, such as "Profile". So you need no separate "Profile" entry below it. A command that
nothing registers leaves the heading a plain heading.

Activation offers **your** slot alone: the workbench's own entries for that item, the ones that hide
it or move it to the other rail, stay on the right-click, where a curation entry beside "Sign out"
would be noise. Such an item needs no `command` or `run`, and the host draws it without one; where it
names one anyway the menu wins and a development-mode message names what is never run. On an item
carrying `workspace:` the click is the switch, so its menu keeps the right-click. The host owns the
rest: it announces the control as opening a menu, tracks whether it is open, and returns focus to it
when the menu is dismissed.

## A picture where you have one

A rail item, a bar button and a menu heading all take
`image`, anything an `<img>` accepts, drawn round in place of the icon and the initials:

```ts
ctx.registerRailItem({
  id: 'notes.account', rail: 'primary', anchor: 'bottom', icon: 'user', initials: 'AR',
  image: person.avatarUrl,
  title: 'notes.account.title', menu: 'notes.account/menu', menuTrigger: 'primary',
  menuHeader: { title: person.name, detail: person.email, initials: 'AR', image: person.avatarUrl },
});
```

The ladder is picture, then initials, then icon, and **the host falls back**: a picture that is
missing or that fails to load leaves the control looking exactly as it would without one. So you do
not have to handle the ordinary case of a person having no photograph. Re-register the item with the
same id when the picture arrives and the rail redraws.

The same two fields sit on a bar button, so the account can live in a bar rather than in the rail.
The host derives which way its menu opens from the bar's own edge: downwards from a top bar, upwards
from a status bar, sideways from a bar docked left or right.

The workbench does not fetch anything for you: the address is yours, and a picture served from
another origin has to be allowed by your own content policy. The picture is decoration, so the entry
stays announced by its title and the menu by its heading, rather than naming the person twice.

## The browser's own menu stays where nobody draws one

Only the element that opens a menu suppresses the native context menu. Everywhere else, your view
body and above all a text field inside it, a right-click still gives the user cut, copy, paste and
spellcheck. Draw your own only where you mean to replace it.

## A menu on your own view body

A right-click on your **own in-process view body** (a list row, a canvas node) is not a host slot;
nothing else contributes to it. Call **`ctx.ui.openMenu(items, { x, y })`** (capability `ui`) with
ad-hoc items, each with a `label`, an optional host `icon` name and an in-process `run` handler. The
`label` is a key of your own bundle or a literal, like every other piece of chrome text. Every label
is looked up as a key, and the open menu is re-worded when the strings of the language in effect
arrive, including after a change of language.
A label no bundle knows, such as a name the user typed, is shown as it is. Development reports one
that looks like a key, with a dot and no spaces, as a missing key, and a literal that happens to equal
a key a bundle knows shows that key's text. The host draws the items as its own `<lw-menu>` at the
cursor, with the same positioning, Escape and outside-click dismissal and focus return as its menus.
The menu is body-level, so a virtual-scroll or `transform`ed ancestor never clips it.

```ts
// inside the component; `ctx.ui` reaches it through the same bridge as any other ctx piece
onRowContextMenu(event: MouseEvent, note: Note) {
  event.preventDefault();
  ctx.ui.openMenu(
    [
      { label: 'notes.menu.open', icon: 'document', run: () => this.open(note) },
      { label: 'notes.menu.delete', icon: 'trash', run: () => store.remove(note.id) },
    ],
    { x: event.clientX, y: event.clientY },
  );
}
```

It is **trusted rung only**: `run` is a function, so it does not cross the sandbox boundary. A
sandboxed surface draws its own menu instead, below.

## Your own surface menu (sandbox)

Inside your own sandboxed `iframe` surface you draw the menu yourself. Load the
[frame UI kit](sandboxed-surfaces.md#the-frame-ui-kit) (`/frame-kit/lw-elements.global.js` defines `<lw-menu>`
along with the rest of the family), build `<lw-menu>` + `<lw-menu-item>` on right-click, and call
`menu.openAt(event.clientX, event.clientY)`. Handle the selection **in-process**: no cross-frame
coordinates, no RPC. The paint follows the host tokens pushed to the surface, so it matches the app theme.

## Where next

- [Commands and their triggers](commands.md): the command a menu entry names, and its rail and bar triggers.
- [Host UI and host facts](host-ui-and-facts.md): the rest of `ctx.ui`, dialogs, toasts and progress.
- [Sandboxed surfaces](sandboxed-surfaces.md#the-frame-ui-kit): the kit that gives a sandboxed surface `<lw-menu>`.
