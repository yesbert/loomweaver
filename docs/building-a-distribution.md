# Building a distribution

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `platform-composition` · `shell-layout` · `gesture-
> configuration` · `persistence-ports` · `access-gating` · `product-identity` · `workspaces` ·
> `plugin-store` · `theming` · `i18n`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

A **distribution** is your product: a thin app that composes `@loomweaver/shell` + your weaver(s), declares
a layout, grants capabilities and sets branding. It's mostly one file — the composition root.

## The composition root

Everything a distribution is lives in **one providers array**, in `src/app/app.config.ts` — the file
`ng new` and Nx both generate. Every "add this provider" instruction in these guides means that array.
`src/main.ts`, `src/app/app.ts` and `src/app/app.html` stay as generated, except that `App` renders
`<lw-shell />`; see [manual setup](manual-setup.md) for those three files.

```ts
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import {
  provideShell, provideShellRouter, provideLayout, providePlugins,
  provideTranslationNamespaces, provideCapabilityGrants, type ShellLayout,
} from '@loomweaver/shell';
import { provideProductIdentity } from '@loomweaver/plugin-sdk';
import { notesWeaver } from '@my/notes-weaver';

const layout: ShellLayout = {
  regions: [
    { id: 'top-bar', type: 'bar', dock: 'top' },
    { id: 'activity', type: 'rail', dock: 'left' },
    { id: 'primary', type: 'panel', dock: 'left' },
    { id: 'left-footer', type: 'bar', dock: 'left' },
    { id: 'main', type: 'content', dock: 'center' },
    { id: 'secondary', type: 'panel', dock: 'right' },
    { id: 'status-bar', type: 'bar', dock: 'bottom' },
  ],
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideShellRouter(),   // content-area routing — replaces provideRouter([])
    provideShell(),
    provideLayout(layout),
    provideProductIdentity({ name: 'Notes Studio', tagline: 'product.tagline', logoUrl: 'logo.png' }),
    provideTranslationNamespaces('notes', 'product'),
    // Default-deny: grant the weaver exactly what its manifest declares.
    provideCapabilityGrants({ notes: ['contributions', 'ui', 'host'] }),
    ...providePlugins(notesWeaver),   // variadic, returns an array — note the spread
  ],
};
```

That's the whole product wiring. The shell renders the chrome; the weaver fills it.

## Which door does my decision go through?

There is no single god-provider, on purpose: each of these has its own shape, and folding them into
one options bag would give the same decision two doors. Instead, here is the whole surface indexed by
what you actually want, so you can go straight to the section that covers it.

**What the product *is***

| I want to … | provider |
| --- | --- |
| set the name, logo and tagline | `provideProductIdentity` ([Branding](#branding)) |
| decide which regions exist and where | `provideLayout` ([Layout](#layout-regions--docks)) |
| recolour the whole app | the design tokens ([tokens](reference/design-tokens.md)) |
| change sizes, radii, density | your own CSS on the class contracts ([tokens](reference/design-tokens.md)) |
| replace a built-in icon | `provideIcons` ([Icons](#icons)) |
| reword the shell itself ("Folder" instead of "View") | `provideTranslationOverrides` ([Rewording](#rewording-the-shell)) |
| ship my own translations | `provideTranslationNamespaces` ([i18n](#i18n)) |

**What users are allowed to *do***

| I want to … | provider |
| --- | --- |
| take a gesture away (splitting, pinning, pop-out, shortcuts …) | `provideShellFeatures` ([Switching capabilities off](#switching-capabilities-off)) |
| drop a built-in command, item, settings row, menu entry or route | `provideShell({ omit })` ([Recomposing host chrome](#recomposing-host-chrome)) |
| hand out layouts the product defines | `provideWorkspaces` ([Developer-defined workspaces](#developer-defined-workspaces)) |
| let users put the arrangement back | nothing: `shell.app.reset` ships ([Resetting](#resetting-the-app-layout)) |

**What ships inside**

| I want to … | provider |
| --- | --- |
| compose my weaver | `providePlugins` + `provideCapabilityGrants` ([Capabilities](#capabilities-default-deny)) |
| run an isolated plugin | `provideFramePlugins` ([Frame plugins](#frame-plugins)) |
| offer a plugin catalogue | `providePluginCatalog` ([Plugin store](#plugin-store-runtime-install)) |
| add chrome of my own | `provideBarItems`, `provideRailItems`, `provideViews` ([Recomposing](#recomposing-host-chrome)) |
| put a search entry in a bar | `provideCommandPaletteEntry`, `provideQuickOpenEntry` ([Command palette entry](#command-palette-entry)) |

**What it talks to**

| I want to … | provider |
| --- | --- |
| feed the signed-in user in | `provideAuthSource` ([Auth integration](#auth-integration-access-gating)) |
| send gated routes to my login | `provideUnauthorizedRedirect` ([Redirect](#3-redirect-gated-routes-to-your-login--provideunauthorizedredirect)) |
| store settings in my backend | `provideSettingsStore` ([Persistence stores](#persistence-stores-optional)) |
| store working state in my backend | `provideWorkingStateStore` ([Persistence stores](#persistence-stores-optional)) |
| keep two users in one browser apart | `provideIdentityScopedStores` ([Identity-scoped stores](#identity-scoped-stores-multi-user-browsers)) |
| compute a following tab's address myself | `provideTabAddressResolver` ([Following tabs](#following-tabs)) |
| route the content area | `provideShellRouter` ([Content-area routing](#content-area-routing)) |
| ship without a service worker | `provideShell({ serviceWorker: false })` ([PWA](#pwa--delivery)) |
| keep hidden surfaces alive by default | `provideShell({ retention })` ([Surface retention](#surface-retention)) |

### Seeing what you composed

In dev mode the shell puts one function on the window. Call it from the browser console once your
app has finished loading:

```
loomweaver.report()
```

It prints the regions your layout declares, the capabilities you switched off and the ids you
omitted, and then warns about the things that quietly land nowhere:

- an `omit` that **matched nothing**, with the prefix you probably meant: omitting `shell.permissions`
  hides a *command or item* by that id, while the settings section of that name needs
  `setting:shell.permissions`, and the bare form fails in silence
- a settings button or menu entry pointing at a **command no one registers** (or one your own `omit`
  removed): the shell drops the control rather than drawing a dead one, and this says why it vanished

One check does not wait for the console, because it is already decidable at startup: a bar, rail or
view contribution aimed at a region your layout does not declare, or declares with another anatomy,
is warned about immediately and told which regions of the right type do exist. That is the
`status` versus `status-bar` mistake, which otherwise ships a product whose status bar is simply
empty.

The report exists in dev only; nothing of it reaches a production build.

## Layout: regions & docks

`provideLayout` declares which **regions** sit where in the border topology. A region has a `type`
(its anatomy) and a `dock` (where it sits):

- **Docks:** `top` · `bottom` · `left` · `right` · `center`.
- **Region types:**
  - `bar` — a thin strip of items in `start | center | end` slots (top bar, status bar, sidebar footer).
  - `rail` — the activity bar: icon triggers for commands.
  - `panel` — a sidebar surface that hosts views (the host auto-tabs multiple views).
  - `content` — the main content area (docks `center`). **URL-addressed** (routes), not views.

A weaver's `registerSurface({ docks: ['primary'] })` / `registerRailItem({ rail: 'activity' })` /
`registerBarItem({ bar: 'status-bar' })` target these region ids. Left and right are symmetric — see
[shell anatomy](reference/shell-anatomy.md) for the full vocabulary.

> **Non-routable surfaces render only in `panel` regions.** A surface's home dock (`docks[0]`) may name
> any region id, but one docked into a `content` (or `bar`/`rail`) region is a silent no-op (dev-mode
> warns). The content area is **routed** — a weaver fills it with a surface that declares
> `routable: { path }` (see below).

## Content-area routing

The content area is URL-addressed. Weavers contribute **routable surfaces**
(`ctx.registerSurface({ routable: { path } })`). Visiting a route opens its tab, and a pane draws a
tab strip whenever it holds tabs; switching between tabs preserves state. The one exception is a
surface that declares `routable: { chromeless: true }` — a full-area screen such as login or
onboarding, which never becomes a tab and shows no strip while it is active.

Exactly **one** pane carries the address at a time; every other pane renders what it holds. That role
follows the user: clicking a tab (or into a pane) hands the address to that pane, and navigating to a
surface another pane already holds reaches it **there** instead of opening a second copy beside the
current one. A workspace that parks a surface in its own pane therefore keeps working when a rail item
or command points at it. For this to work, the distribution sets up the router with
**`provideShellRouter()`**. Call it **instead of** `provideRouter([])`. It bundles
`withDisabledInitialNavigation()`, the state-preserving reuse strategy, and the route sync as one
unit, so you can't half-configure it. Pass your own non-content
routes as `provideShellRouter([...routes])` if the distribution has any. Authoring the routes/tabs
themselves is the weaver's job — see [authoring a weaver](authoring-a-weaver.md#content-area--routes--tabs).

**Preview tabs (optional).** The content area supports VS-Code "Preview Editors" — a weaver opens with
`preview: true` to reuse a single italic slot. It is **on by default**; opt out for the whole
distribution with `provideShellFeatures({ content: { preview: false } })` (mirrors
`workbench.editor.enablePreview`), which makes every `openContentTab` a permanent tab.

**User reordering (optional).** Users can drag or keyboard-reorder the host chrome — content tabs,
rail items and view tabs within their own band, with the order persisted user-locally. It uses
`@angular/cdk/drag-drop` (a `@loomweaver/shell` peer dependency) and is **on by default**. Toggle per
container with
`provideShellFeatures({ content: { reorderTabs: false }, rail: { reorder: false }, sidebar: { reorderViews: false } })`.

**Carrying an item to the *other* bar is a different capability**, because a user meets it as one:
`sidebar.moveViews` covers moving a view between the left and right sidebars (Obsidian-style) and
`rail.moveItems` the same for rail entries — each taking the menu entry, the drag *and*
`Alt+Shift+Arrow` together.

**The user curates a sidebar the way they curate the rail.** A right-click on a view tab offers *Move
to other sidebar* and *Hide*; a right-click on the strip offers **Customize views**, which opens a
dialog listing every view with **where it sits**: hidden, left, or right. Picking a place moves it
there, so the dialog does the hiding and the moving in one control, and a view hidden on the left
comes back wherever you send it. The dialog has a search field and scrolls, because a product with
many views would otherwise be a wall of rows. Which views a sidebar holds is part of the workspace,
so switching workspaces changes it; the rail's own curation stays put.

The dialog is the command `shell.views.customize`, so it is reachable from the command palette,
bindable to a shortcut, callable from an item of your own, and removable with
`provideShell({ omit: ['shell.views.customize'] })`. The menu entry is a contribution of its own
(`menu:shell.views.customize`), so you can drop the entry and keep the command.

**Panes & splits (always on).** Every dock (centre + both sidebars) is a tree of **tab-group panes**.
Users split a pane by dragging a tab to its edge or via a tab's **Split right / Split down** menu, move
tabs between groups by dragging onto a strip, and resize with the dividers (Obsidian-style).
Exactly one centre pane is the **URL pane** (it drives deep links / back-forward); the rest are workspace
state. The whole arrangement — pane trees, sizes, active tabs — is persisted user-locally and reload-safe.
There is always **exactly one active workspace**: a fresh installation starts in the built-in *Default*
workspace, and everything the user rearranges belongs to the workspace they are standing in. **Named
workspaces** (`shell.workspace.manage`) are self-remembering — switching restores each workspace's own
live arrangement exactly, without asking and without discarding anything. Each workspace also has a
**baseline**: for a user-saved workspace the explicitly saved snapshot ("Save as new" captures the
current arrangement and switches to it; "Save workspace" updates the active one's baseline). **Reset
layout** (`shell.workspace.reset`) discards the active workspace's live arrangement and re-applies its
baseline after a confirm — for the Default workspace that is the declared factory layout. It is
reachable from the palette, and also as a button in the workspaces dialog. Saved workspaces,
theme, language and named view instances are kept. This is core behaviour with no provider to wire.
It rides on the same [persistence stores](#persistence-stores-optional) as the rest of the chrome.

### Resetting the app layout

The workspace reset is deliberately narrow: it puts back what belongs to the active workspace. The
arrangement that lives beside every workspace — the activity bar the user curated, collapsed
sidebars, sidebar widths, hand sorting of tabs and rail entries, and named view instances with their
state — has its own reset, **`shell.app.reset`**. It sits in the palette and as a *Reset layout*
button under **General** in the settings dialog, and it asks first, naming what comes back and what
stays: saved workspaces and their layouts, colour scheme, language, text size, granted permissions
and installed plugins are never touched. A surface with unsaved work is guarded exactly as it is on a
workspace reset.

Take it away like any other contribution: `omit: ['shell.app.reset']` drops the command, and with it
the settings button, because a button naming a command nobody registered is dropped rather than drawn
dead.

### Telling saved workspaces apart

A workspace a **user** saved has no icon to declare, so the shell derives a two-letter badge from its
name and draws it wherever a developer-defined workspace would draw its icon: the rail entry, the
workspace dialog and the activity-bar curation list.

The letters are the initials of the first two words, or for a single word its **first and last**
letter: "Month End" reads ME, "Review" reads RW, "Reports" reads RS. First-and-last rather than the
first two, because the first two collide far too often — over a corpus of realistic names, "first
two" left more than half of them sharing a badge, since Review, Reports, Rechnungen and Recherche all
begin RE.

When two names would still land on the same badge, only the **newer** one steps aside, to
first-and-second, first-and-third and so on: Kunden keeps KN and Konten becomes KO. So adding a
workspace never renames anyone else's badge, and two letters stay two letters unless a name runs out.

The badge is derived, not stored: a rename updates it by itself and there is nothing to migrate.
Deleting a workspace may let a later one simplify back to a shorter form, which is the price of not
storing it — deletion is far rarer than creation, and the badge gets simpler rather than stranger.

**Whether the user may put their own saved workspaces in the rail is yours to decide.** They are
never there by themselves; the user places one from *Customize activity bar*, and
`workspaces: { savedInRail: false }` withdraws that offer, so the rail holds what your product put
there and nothing else. An entry a user had placed before you switched it off stops being drawn, and
their placement is kept rather than erased, so switching it back on restores what each of them had.
Everything else about a saved workspace is untouched: saving, renaming, resetting and switching all
work, with the workspace dialog as the way to them. This says nothing about **whether** a user may
save workspaces, which is a different question and has no switch.

**A saved workspace is a variant of the one it was saved from.** The shell records which
developer-defined workspace was active when the user saved, shows it under the name in the workspace
dialog ("Variant of Quotes"), and lets the variant keep whatever content that workspace
[claims](#claiming-the-content-that-belongs-to-a-workspace) — so a user who built their own way of
working with quotes is not thrown out of it the moment they open one.

The origin is read through rather than copied, so a claim you add later reaches every variant of that
workspace. Saving from a variant produces another variant of the same declared workspace, so the
relation is always one step deep. Saving from the built-in empty workspace leaves a variant without
an origin, as does removing the workspace it came from: it then claims nothing, is listed without an
origin line, and is otherwise unchanged. The origin cannot be moved afterwards; a user who wants
their arrangement to belong elsewhere saves it again from there.

Your own rail items can do the same with `initials` on a `RailItem`, for entries the user named
(projects, accounts). The host draws the letters in place of the icon, in the app font and in the
colour the icon would have taken, so hover and the active marker behave as they do everywhere else;
`icon` stays required as the fallback.

### Developer-defined workspaces

A distribution can ship ready-made workspaces next to the user's own with **`provideWorkspaces`**.
They are switchable and self-remembering like any workspace and resettable to their declaration — but
their baseline lives in code, so the user cannot overwrite, rename or delete them. Because they behave
differently, the workspace dialog keeps them in **their own list**, beside the user's: it opens on
whichever list holds the **active** workspace, and each label carries its count, so a visitor who has
saved nothing yet still sees that the product ships some. A distribution that ships none never sees the
switch. Invalid declarations are reported to the console in dev mode, naming what is
ignored; nothing fails silently at runtime.

**Declaring a workspace does not put it in front of anyone.** The dialog lists it, and that is all —
the workbench draws entries only for the workspaces a *user* saved, because those have nothing but a
typed name to go on. A workspace you declared is yours to offer: register a rail item carrying
`workspace: '<id>'` and the icon you want it under, and the host does the rest — it performs the
switch and marks the entry while that workspace is active, so the item needs no command of its own.
A declared workspace that nothing offers is reported in dev mode.

```ts
// src/app/app.config.ts — in the providers array
import { provideRailItems, provideWorkspaces } from '@loomweaver/shell';

provideRailItems({
  id: 'acme.rail.review',
  rail: 'activity',
  icon: 'review',       // yours, not a derived marker — that is for workspaces the user saved
  title: 'product.workspace.review',
  workspace: 'acme.review',
});

provideWorkspaces({
  id: 'acme.review',
  title: 'product.workspace.review', // a Transloco key (or a literal — unknown keys render as-is)
  icon: 'workspaces',
  sidebars: { primary: ['acme.nav'] }, // visible views per panel region; {} hides every sidebar
  content: {
    columns: [
      { size: 35, tabs: [{ path: 'entry/e-01', closable: false }] },
      { rows: [{ size: 60, tabs: ['search'] }, { tabs: ['notes'] }] },
    ],
  },
});
```

Each declaration is a **`WorkspaceDefinition`**. Its `content` is a **`WorkspaceArea`**: exactly one
of `tabs` (a **`WorkspaceTabArea`** — the pane's tabs), `rows` (a **`WorkspaceRowArea`** — panes
stacked top-to-bottom) or `columns` (a **`WorkspaceColumnArea`** — side by side), nested freely. All
three extend **`WorkspaceAreaBase`**, whose only member is `size`: a percentage; unsized siblings
share the remainder, and sizes that do not add up are normalised proportionally. A tab (a
**`WorkspaceTabEntry`**) is a route path string, or a
**`WorkspaceTab`** object to mark it `active` or `closable: false` — an unclosable tab survives
*Close all* and cannot be dragged away. The first `tabs` area in reading order becomes the URL pane.
`sidebars` names the **visible** views per panel region: listed views show in that order and the
region's other declared views are hidden (the user can re-show them from the panel header menu, in
whichever sidebar they right-click). List a region with an **empty array** to show none of its views —
the sidebar itself stays, empty. A region you leave out, or omitting `sidebars` entirely, keeps
whatever the user has there. A region can only list views declared for it; a view the user has moved
to the other sidebar stays where they put it.
(`WORKSPACE_DEFINITIONS` is the token behind the provider; a distribution never injects it itself.)

**`initial: true` makes one of them the workspace a fresh install opens in**, instead of the empty
`default`. It applies **once**, on a first boot with nothing stored yet, and the choice is written
immediately — so a user who switches away is not sent back on the next reload. A **deep link still
wins**: the baseline is laid out, but the address the app booted with is the one you land on, so a
shared link opens what it names rather than the workspace's own tab. If two declarations set it, the
first wins, as with a duplicate id.

```ts
provideWorkspaces({
  id: 'acme.review',
  title: 'product.workspace.review',
  initial: true, // where a fresh install starts; the user's own later choice wins from then on
  content: { tabs: ['entry/e-01'] },
});
```

#### Claiming the content that belongs to a workspace

A workspace can say which content addresses belong to it, and reaching one of them then takes the
user there. Without it, a document opens wherever the user happens to be: a shared link, a
notification, the command palette or a plugin opening a tab all leave a quote laid over a dashboard
built to hold none.

```ts
provideWorkspaces({
  id: 'acme.quotes',
  title: 'product.workspace.quotes',
  claims: ['quotes/:id'], // every quote document, and everything below one
  sidebars: { 'left-panel': ['quotes'] },
  content: { tabs: [{ path: 'quotes/q-0005', closable: false }] },
});
```

**A claim moves the user whenever the address is reached**, not only when they arrive from outside:
a link, a restart, a command, a programmatic navigation, a tab a plugin opened. There is deliberately
no exception for an address reached from inside the application, because a rule that holds only
sometimes cannot be predicted by the person it moves. The rail marks the workspace as current by
itself, since that follows the active workspace and nothing else.

Claim only what genuinely belongs to a workspace. A narrower claim wins over a wider one, the way a
specific route already wins over a general one, so `quotes/new` and `quotes/:id` can live in
different workspaces. Two workspaces claiming addresses of the *same shape* is a configuration error:
the claim is dropped from both and the console names them, because a product that declared two homes
for one document has not decided where it belongs.

A workspace the **user** saved is never where an address leads. It exists on one machine only, and an
address that led somewhere different for every user would not be an address. It does keep content
its origin claims, which is what [variants](#telling-saved-workspaces-apart) are about.

**Whether a sidebar exists, is open, and how wide it is belongs to the window rather than to the
workspace.** Your layout decides which sidebars the app has, the user decides whether they are open
and how wide, and switching never collapses, resizes or removes one: the user sets that once and it
holds everywhere, the same way the rail stays put. A workspace decides what is *in* the sidebars; the
frame around them is the anchor you switch from. A workspace that wants a distraction-free screen
lists its regions empty — the sidebar is then simply empty, and it is the user, not the workspace,
who decides whether to fold it away.

A workspace can also sit **in the rail**, so switching costs one click instead of a dialog. Give a
rail item the workspace's id with `workspace` and the host does the rest: the click switches, and
while that workspace is active the entry is marked as the current one — a brand bar on the rail's
outer edge, a tint, and `aria-current="true"` for screen readers. Provide `workspace` **instead of**
`command`/`run`; when it is set those are ignored. An entry pointing at a workspace that is neither
declared nor saved warns in the console in dev mode rather than failing silently.

```ts
// src/app/app.config.ts — in the providers array
import { provideRailItems } from '@loomweaver/shell';

...provideRailItems({
  id: 'acme.workspace.review',
  rail: 'activity',
  icon: 'workspaces',
  title: 'product.workspace.review',
  workspace: 'acme.review', // the id declared in provideWorkspaces
}),
```

The rail is deliberately **not** part of workspace state: it is the fixed anchor you switch from, so
its entries and the user's ordering of them stay put across every switch. The built-in default
workspace has no declaration and therefore no rail entry of its own; the workspace dialog remains the
way back to it.

**The user curates the rail, exactly the way they curate a sidebar's views.** A right-click on an
entry offers *Move to other activity bar* and *Hide*; a right-click on the rail itself offers
**Customize activity bar**, which opens a dialog listing every entry with where it sits: hidden,
left, or right. An entry is either hidden or in **exactly one** rail, and it moves between rails from
that dialog, from the entry's menu, by dragging it across, or by focusing it and pressing
`Alt+Shift+←/→`. Where a layout has a bar on only one side, the dialog offers *Hidden* and *Shown*
rather than two sides, and the *Move to other …* menu entry is not registered at all: it would have
nowhere to move to.

The dialog is the command `shell.rail.customize`, with the same consequences: palette, shortcut, your
own trigger, or `omit`; the menu entry is `menu:shell.rail.customize`. Switching the capability off
(`rail: { curate: false }`) removes command, menu entry and right-click together.

The list holds two kinds. The entries your distribution and its plugins registered are shown in their
declared rail until the user hides or moves one. The user's **own saved workspaces** are hidden until
the user puts one somewhere; that is all "pinning" is, and the entry then behaves like a declared
one, marking itself while its workspace is active. Both the visibility and the placement are stored
app-wide rather than per workspace, for the same reason the rail itself is.

`rail` is therefore where an entry **starts**, not where it is bound to stay — the same thing
`provideViews`' `region` became once views could move between sidebars. Nothing changes for a user
who never moves anything.

Two consequences worth knowing. A hidden entry takes its affordance with it, including for something
like *Settings* or *Sign out*: nothing becomes unreachable, because the command palette still runs
every command and the same right-click brings the entry back, but a distribution cannot assume its
rail is intact. And an entry that declares its own context menu with `menu` keeps it, because the
host's *Hide* is added to that menu rather than replacing it.

### Switching capabilities off

Every capability the shell offers its users is on by default: the platform ships the full workbench,
and a product that would overwhelm its users switches parts off with **`provideShellFeatures`**.
Fields merge group by group, so name only what you turn off.

A switch takes the **affordance and the gesture**. Turning `splitRight` off removes the toolbar
button, the left/right drop edges *and* `mod+\`, so the capability cannot come back through a second
door.

Every capability is on by default. `content.escalate` is the double-click cycle on a tab
(preview → keep → pin → unpin); its first step is the one users arrive expecting, and a preview tab
says so itself — its tooltip reads "double-click to keep open". Switch it off with
`provideShellFeatures({ content: { escalate: false } })` and the tooltip drops that promise, so no
hint advertises a gesture that does nothing. Every step of the cycle stays reachable from the tab's
context menu either way.

```ts
// src/app/app.config.ts — in the providers array
import { provideShellFeatures } from '@loomweaver/shell';

provideShellFeatures({
  content: {
    close: true,        // default: the × affordance, Delete, and the menu's close entries
    pin: true,          // default: the menu entry and the pin step of the double-click cycle
    escalate: true,     // default: the double-click cycle preview → keep → pin → unpin
    moveTabs: true,     // default: dragging a tab into another pane, or onto an empty one
    preview: true,      // default: the single reused italic preview slot
    newTab: true,       // default: the "+" button and its picker
    splitRight: true,   // default: button + left/right drop edges + mod+\
    splitDown: true,    // default: button + top/bottom drop edges
    maximize: true,     // default
    minimize: true,     // default
    reorderTabs: true,  // default: drag or Alt+Arrow within a band
  },
  sidebar: {
    collapse: true,           // default: collapsing and expanding a panel
    resize: true,             // default: the splitter that changes a panel's width
    reorderViews: true,       // default: sorting views *within* one sidebar
    moveViews: true,          // default: menu entry + drag + Alt+Shift+Arrow to the other sidebar
    hideViews: true,          // default: the "Hide" menu entry
    curate: true,             // default: the checklist on the icon strip
    stackViews: true,         // default: menu entry + dropping a view on a sidebar edge
    acceptTabs: true,         // default: parking a foreign tab in a sidebar
    openViewInContent: true,  // default: the menu entry
    resetViewState: true,     // default: the menu entry
    instances: true,          // default: the named-instance switcher in the panel header
  },
  rail: {
    reorder: true,    // default: sorting items *within* one rail
    moveItems: true,  // default: menu entry + drag + Alt+Shift+Arrow to the other rail
    hideItems: true,  // default: the "Hide" menu entry
    curate: true,     // default: the checklist on empty rail space
  },
  workspaces: {
    enabled: true,      // default: the manage and reset commands, and workspace entries in the rail
    savedInRail: true,  // default: the user may put a workspace they saved in the rail
  },
  windows: {
    popout: true,     // default: "Open in new window" on a tab and on a docked view
  },
  commands: {
    shortcuts: true,     // default: keyboard chords, and the chord hints beside entries
    recentlyUsed: true,  // default: the palette's "Recently used" section
  },
}),
```

The groups are typed: `ContentFeatures`, `SidebarFeatures`, `RailFeatures`, `WorkspaceFeatures`,
`WindowFeatures` and `CommandFeatures` make up `ShellFeatures`, and `ShellFeaturesInput` is the
partial you pass.

`commands.shortcuts: false` takes the global key listener **and** every chord hint the shell prints,
so no menu entry or palette row advertises a key that does nothing. Commands stay reachable by their
buttons and by the palette. `workspaces.enabled: false` leaves storage scoping untouched — the
active workspace still names the layout keys, the user simply never meets the concept.

A rail or bar item that names a command **nobody registered** is dropped rather than drawn, the same
way an orphaned menu entry is: switching a capability off never leaves a dead button behind.

Sorting and moving are separate on purpose. `reorderViews` and `rail.reorder` govern the order
**inside** one bar; carrying an item **to the other** bar is `moveViews` and `rail.moveItems`, and
that one switch covers the menu entry, the drag and `Alt+Shift+Arrow` together.

A **container** surface's nested pane tree inherits these switches like any other pane, so a product
that turns splitting off does not get it back inside a "workspace-in-a-tab".

`provideShellFeatures` is the home for **gestures**. A *contribution* (a command, a bar or rail item,
a settings row, a menu entry) is not a gesture and is removed with
[`provideShell({ omit })`](#recomposing-host-chrome) instead.

The retention default is **not** a user-facing capability but a storage policy, so it lives on
`provideShell` (`RetentionDefault` is `'destroy' | 'retain'`):

```ts
// src/app/app.config.ts
provideShell({ retention: 'destroy' }), // default
```

Every content pane — the URL pane and secondary panes alike — shows the **same** inline toolbar via one
component: New Tab · Split right · Split down · **Minimize** · **Maximize** · Close. The two
split gestures have one consistent meaning everywhere. The **toolbar split duplicates** the active
tab into a new pane; the tab stays where it is. **Dragging a tab or its Split right/down menu moves
it**. The split buttons only appear when the active content can be duplicated. **Maximize**
fills the whole viewport over all chrome (header, sidebars, other panes); Escape or the button restores it.
**Minimize** collapses a pane in a split to a thin strip. The strip shows the active tab's icon and
name, plus a `+N` badge when the pane holds several tabs. Clicking the strip restores the pane.
Minimize and Close appear on both panes of a split. Closing the URL pane dissolves the split and the
neighbour takes over the URL. With a single pane only Maximize is shown, since there is nothing to
minimize into or close. Hide any affordance distribution-wide with
`provideShellFeatures({ content: { splitDown: false, maximize: false, minimize: false } })` (fields merge,
so the others stay on). A pane that holds no tabs stays strip-less and gets a floating toolbar
instead — it honours the same `toolbar` options — and a chromeless screen shows no strip at all,
however many tabs are parked behind it. Both regain the strip as soon as they hold a tab and the
chromeless screen is left; a tab the strip does not draw would be a tab nobody can reach again.

### Following tabs

A weaver may declare a permanent tab as a **facet of the current selection** rather than a document of
its own (`routable: { follows: true }`, see
[authoring a weaver](authoring-a-weaver.md#tabs-that-follow-the-selection--follows)). The host then
substitutes the parameter values of the address it is on, by name, into that tab's pattern.

Part of that mapping is domain knowledge the platform cannot have — a query parameter carried by one
tab deciding a path segment on another, say. Supply it and the platform keeps its substitution for
everything you pass on:

```ts
// src/app/app.config.ts
provideTabAddressResolver(({ surfaceId, params, activePath }) =>
  surfaceId === 'treaties' && params['cedentId']
    ? `cedents/${params['cedentId']}/treaties/${treatyFor(activePath)}`
    : null,   // null → the host's own substitution
),
```

The resolver is a `TabAddressResolver`, and its `TabAddressInput` carries the following surface's
`surfaceId` and `pattern`, the `params` of the address you are on and that `activePath` in full. Your
answer is taken at its word: the host checks reachability only for its own computation, where an
address that leads nowhere means the facet has no selection yet and its tab is left out.

### Surface retention

One rule governs every surface and every hiding gesture: **a hidden surface is destroyed as
soon as it is clean.** "Hidden" means rendered by no pane of this window: a tab switch, a minimised or closed pane, a
collapsed sidebar and the closed compact drawer all hide a surface. By default
(`retention: 'destroy'`) the instance is destroyed and rebuilt on return. Component-local fields
therefore do not survive. State that must survive belongs in `VIEW_STATE`. `VIEW_STATE` also
survives a reload — the invariant is *evictable = reload-safe*. A surface can opt out individually with `retain: 'always'` on its declaration (an
expensive rebuild, a live connection), and a distribution can flip the
app-wide default with `provideShell({ retention: 'retain' })` — the surface declaration
(`'always'`/`'never'`) wins over the default.

A retained routable surface is host-mounted in **every** pane — the URL pane included, where its
route only carries the address — and its instance is keyed to the pane it sits in, so handing the
address between split panes leaves each pane's instance where the user put it. The trade: a retained
surface sees a host-fabricated route (route params work; resolvers, query params and nested
`subRoutes` outlets do not), and flipping the app-wide default to `'retain'` applies that trade to
every surface that does not opt out with `'never'`.
**Sandboxed (`iframe`) surfaces retain too**: a retained one is hidden in place rather than destroyed, so
the plugin's document keeps running and no Penpal handshake is paid per tab switch. It is still rebuilt
whenever it would have to *move* — a split, a drag into another pane, a minimise — because moving an
`<iframe>` element in the DOM reloads it. `container` surfaces are always rebuilt. A retained instance is
destroyed once its tab is actually **closed** — retention covers hiding, not closing.

**"Clean" is the plugin's word.** A surface component that implements `DirtySurface` (see
[authoring a weaver](authoring-a-weaver.md#unsaved-changes--implement-dirtysurface)) is never destroyed
while it reports unsaved changes, so no hiding gesture ever loses work or needs a prompt. Destruction
that the user initiates — closing a tab, closing a pane, *close others/all/to the right* — goes
through the **host's own localised dialog**. Its buttons are *Save* · *Discard* · *Cancel*; Save
appears only when the surface can save. That gives one wording, one translation and one keyboard
behaviour across every plugin, and no plugin draws its own dialog. The one exception is the optional
`surfaceBeforeClose` veto a surface can implement. The veto runs first, carries a host-enforced
timeout and a guaranteed **"Close anyway"** escape, and never bypasses the unsaved-changes ask for a
still-dirty instance. **Programmatic destruction asks too.** Disabling, uninstalling or updating a plugin (the switches in
*Permissions* and the plugin store) runs the same unsaved-changes dialog over the affected instances
before anything is destroyed. So does resetting a workspace. **Switching** a workspace never asks:
each workspace remembers its own arrangement, and a dirty surface survives the switch parked, under
the same retention rule as any hidden surface. The `beforeClose` veto is
deliberately *not* consulted there — a plugin cannot veto its own removal.
Closing the browser window while anything is dirty triggers the native `beforeunload`
prompt — whose wording and language are the **browser's own**: browsers ignore page-supplied text
there and localise it to the browser UI language, not the app's. There is nothing to wire — all of
this rides on `provideShellRouter()`. The complete
author-side recipe — component, save flow, `saveOn: 'hide'`, veto, and the sandboxed variant — is
[recipe 8 in Samples](samples.md#an-editor-with-unsaved-changes).

## Branding

`provideProductIdentity({ name, tagline, logoUrl })` is your product's identity: the
neutral shell reads it (header, About, PWA manifest). `name` is a literal; `tagline` is a translation
key (put it in your `product` namespace). Without it, the bare LoomWeaver identity shows.

**Colors (tenant/product theme).** Override the `--lw-*` design tokens by importing a theme CSS *after*
the shell theme in your `styles.css`, wrapped in `@layer lw-tenant-theme` so it beats any plugin's
`ctx.contributeTheme` (precedence is Product < Plugin < **Tenant**):

```css
/* src/styles.css */
@import 'tailwindcss';
@import '@loomweaver/shell/styles/theme.css';
@import './themes/acme.css'; /* AFTER the shell theme */
```

```css
/* src/themes/acme.css — the --lw-* ladder flips in :root.dark, so override both */
@layer lw-tenant-theme {
  :root {
    --lw-brand: #2e96c9;
    --lw-accent: #c59a2f;
  }
  :root.dark {
    --lw-brand: #3aa9dd;
    --lw-accent: #d8b45a;
  }
}
```

The `theme` generator scaffolds exactly this file with the full token ladder — see
[Scaffolding](scaffolding.md); the token names live in
[design tokens](reference/design-tokens.md). A plugin can re-skin the app, but your branding stays
unassailable.

The tokens cover **colour and type only**. Sizes, radii and spacing deliberately have none, because
tokenising every number would freeze every rule of our chrome into a promise; if your product has to
change one, plain unlayered CSS wins over everything the shell paints, and
[design tokens → dimensions](reference/design-tokens.md#dimensions-there-are-no-tokens-and-how-to-change-them-anyway)
gives the recipe and its two honest limits.

**Tailwind is optional.** The snippet above assumes it because it is the default the quickstart sets
up, but the shell also ships pre-compiled: `@import '@loomweaver/shell/styles/shell.css';` on its own
replaces both the `tailwindcss` import and the `@source` glob. Take that route when your product is
themed with a different framework, and read
[bringing your own CSS framework](manual-setup.md#bringing-your-own-css-framework) first — a foreign
framework imported *unlayered* outranks all of ours regardless of specificity, so it has to go into a
layer of its own. On Bootstrap 5.3 you do not have to write the token mapping at all:
`loomweaver theme --name acme --preset bootstrap` points the `--lw-*` ladder at Bootstrap's `--bs-*`
variables. If your own UI has to follow light and dark, inject
[`ThemeService`](reference/host-services.md) and mirror `resolvedTheme()`.

## Capabilities (default-deny)

`provideCapabilityGrants({ <pluginId>: [...capabilities] })` is the grant authority. Grant each
weaver exactly the capabilities its manifest declares — nothing is granted implicitly, and the
effective set is the **intersection** of grant and declaration (a grant for an undeclared capability
is inert; dev mode warns). The coarse
capabilities are `contributions` (register views/commands/items/routes/icons), `ui` (dialogs, toasts,
settings), `host` (version/update facts), `navigation` (drive the content area —
`navigateContent`/`openContentTab`/`closeContentTab`), `session` (read login state + roles via
`ctx.session` for self-gating), `theme` (contribute `--lw-*` tokens — colors and the UI font — that re-skin the whole
app via `ctx.contributeTheme`), and `automation` (run actions *other* plugins contributed, via
`ctx.invokeCommand`/`ctx.invocableCommands`, and only those their authors declared `callable`). (Later your own per-tenant backend can become this grant
source without changing the seam.)

The shell ships a built-in **Permissions** settings section (under Options). It lists every plugin.
The user can **turn a whole plugin off** with an on/off switch: the plugin unloads and none of its
contributions appear, and turning it back on reloads it, live. Per enabled plugin, the user can also
**revoke** individual capabilities. Both are user-local (persisted through the settings store) and take effect immediately —
enabling/disabling reconciles activation reactively, and a capability revocation reads the live grant on
the plugin's next `ctx` call. The user can only narrow, never widen beyond what you granted here, so least
privilege is preserved. Nothing to wire — it appears automatically.

Two things keep this safe by default, both host-provided: (1) a blocked `ctx` call that runs through a
command surfaces a **warning toast** ("… open Settings → Permissions") instead of failing silently; and
(2) the host command **`shell.openSettings`** opens the settings surface without any plugin capability,
so the user can never lock themselves out — it is always reachable from the command palette (`mod+k`).
Wire your own settings launcher (rail item, menu) to `shell.openSettings` rather than a plugin's gated
`ctx.ui.openSettings`, so it keeps working even when a plugin's capabilities are revoked.

## Auth integration (access gating)

LoomWeaver owns **no** authentication — login, session, tokens and the identity provider live in your
product (OIDC / your own identity platform / …). The platform only *reacts* to a **session snapshot** so contributions can
gate themselves by login state and roles (see [authoring a weaver → `access`](authoring-a-weaver.md)).
Integrating a real product is two providers plus your own login UI.

### 1. Feed the session — `provideAuthSource`

Map your product's session into a `Signal<AuthSnapshot>`. The factory runs in the injection context, so
it can `inject()` your own session service. The bare default is anonymous.

```ts
// src/app/app.config.ts — in the providers array
import { provideAuthSource } from '@loomweaver/shell';
import { AuthSnapshot, ANONYMOUS } from '@loomweaver/plugin-sdk';

provideAuthSource(() => {
  const session = inject(MyProductSession);          // your product's auth (OIDC/custom/…)
  return computed<AuthSnapshot>(() => {
    const u = session.currentUser();                 // reactive source of truth
    return u
      ? { authenticated: true, roles: u.roles, claims: u.claims, displayName: u.name }
      : ANONYMOUS;
  });
}),
```

This signal is the **single hook**: when it changes — login, logout, a role change — the whole shell
re-gates **reactively**. Rail/bar/view/view-action items, the command palette, keybindings, the pane
toolbar's New-Tab picker and the content-route guards all re-evaluate automatically; you never call the
host to "refresh".
`AuthSnapshot` is `{ authenticated, roles, claims, subject?, displayName? }`. `roles`/`claims` are
opaque strings the host matches but never interprets, and `claims` goes no further than your own
code — a plugin permitted the session is told `authenticated` and `roles` alone. `subject` is the
**identity anchor**: set it
whenever your product can name the signed-in principal. Encode the tenant into it if tenant switches
should count as identity changes. The identity features below stay inert without `subject`.

**Identity-change policy (multi-user browsers).** Gating is presentation-only: when user B signs in
after user A on the same browser, A's pane trees, tab titles, workspaces and every plugin's in-memory
state would otherwise stay alive. Opt in to the platform's policy instead of hand-rolling
subject-change detection:

```ts
// src/app/app.config.ts — in the providers array
provideAuthSource(() => mySnapshot, { onIdentityChange: 'reload' }),
```

With `'reload'`, the shell performs a full `location.reload()` when one **established** subject is
replaced by a **different** one. First sign-in (anonymous → subject) and sign-out (subject →
anonymous) never fire — an async session restore at boot causes no reload flicker. Pair it with
[identity-scoped stores](#identity-scoped-stores-multi-user-browsers): the namespace then only
ever changes across a reload boundary, so the new session re-hydrates entirely from its own state.

### 2. Own the login UI (page or dialog)

The platform ships **no** login screen — and it never opens yours on its own. Knowing exactly *when*
an unmet `access` requirement leads to your login UI is the key to wiring it correctly. There are
three situations:

| Where access fails                                                    | What the shell does                                                              | Where your login UI comes in                                                          |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Chrome — rail/bar items, view actions, commands, palette entries       | Hides the item (or disables it with `mode: 'disable'`). **Nothing opens.**        | Offer your own always-visible entry point (a "Sign in" rail item or command).           |
| A gated **content route** — deep link, tab click, in-app navigation    | Shows a neutral "sign-in required" placeholder at the same URL.                   | Register a redirect to your login page instead — step 3 below. This is the only place the platform actively sends anyone towards a login. |
| Inside your own components                                             | Nothing — `AuthContext` (distribution) / `ctx.session` (plugin) just report state. | Open your login dialog imperatively wherever your UX calls for it.                      |

**Shape A — a login page.** An ordinary, ungated routable surface. The component reads the path the
visitor was originally headed to (the `from` query parameter your redirect handler sets in step 3),
signs in through *your* product's auth service — which flips the `provideAuthSource` signal — and
navigates back. Reactivity does the rest: the route guard now passes, and every gated rail item,
command and tab appears without a reload.

```ts
// In the weaver's activate():
ctx.registerSurface({
  id: 'app.login',
  title: 'app.login.title',
  routable: { path: 'login' },
  component: LoginView,
});
```

```ts
// src/app/login-view.ts — your own component, not the platform's
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MyProductSession } from './my-product-session';

@Component({
  selector: 'app-login-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
      <h2 class="text-lg font-semibold text-content">Sign in to continue</h2>
      <button type="button" class="lw-btn lw-btn--primary" (click)="signIn()">Sign in</button>
    </div>
  `,
})
export class LoginView {
  private readonly session = inject(MyProductSession);
  private readonly router = inject(Router);
  // Set by the provideUnauthorizedRedirect handler (step 3); '' → land on home after sign-in.
  protected readonly from =
    inject(ActivatedRoute).snapshot.queryParamMap.get('from') ?? '';

  protected async signIn(): Promise<void> {
    await this.session.signIn(); // your auth; on success the AuthSnapshot signal flips
    await this.router.navigateByUrl('/' + this.from); // back to where the visitor was headed
  }
}
```

(The in-repo testbed ships exactly this flow — `testbed-login-view.ts` in `@loomweaver/testbed-weaver` plus the
`admin-area` redirect in `loom-testbed/main.ts` — if you want to see it run.)

**Shape B — a login dialog.** Opened from your own entry points through the host dialog service. On
success it just closes itself — no navigation needed, because every gated surface re-evaluates the
moment the signal changes. The opened component injects `DialogRef` to close itself:

```ts
// Entry point — a command; bind it to a rail item, bar button, shortcut or leave it in the palette:
ctx.registerCommand({
  id: 'app.signIn',
  title: 'app.signIn',
  run: () => {
    ctx.ui.open(SignInDialog, { title: 'app.signIn.title', icon: 'settings' });
  },
});
ctx.registerRailItem({
  id: 'app.rail.signIn',
  rail: 'activity',
  icon: 'settings',
  title: 'app.signIn.title',
  anchor: 'bottom',
  command: 'app.signIn',
});
```

```ts
// src/app/sign-in-dialog.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef } from '@loomweaver/plugin-sdk';
import { MyProductSession } from './my-product-session';

@Component({
  selector: 'app-sign-in-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <p class="text-sm text-content-muted">Use your organisation account.</p>
      <button type="button" class="lw-btn lw-btn--primary" (click)="signIn()">Sign in</button>
    </div>
  `,
})
export class SignInDialog {
  private readonly ref = inject(DialogRef);
  private readonly session = inject(MyProductSession);

  protected async signIn(): Promise<void> {
    await this.session.signIn(); // flips the AuthSnapshot signal → the shell re-gates live
    this.ref.close();
  }
}
```

A declaratively gated "Sign in" entry that only shows while signed **out** is intentionally not
expressible: `access` can require a session, never forbid one. Leave the entry ungated — it is
harmless while signed in. Or hide it from your own component by reading `AuthContext`.

**Sign out** is symmetric and needs no platform call: your product resets its own session, which
flips the snapshot back to `ANONYMOUS` — the shell hides everything that required a login the moment
the signal changes. Give it an entry point that is itself gated, so it only shows while signed in:

```ts
// `run` executes outside Angular's injection context — resolve your session facade in activate()
// (or use a module-level facade, as the in-repo testbed's `testbedAuth` does), not via inject() in run().
ctx.registerCommand({
  id: 'app.signOut',
  title: 'app.signOut',
  access: { authenticated: true },
  run: () => myProductAuth.signOut(), // sets the snapshot back to ANONYMOUS
});
```

### 3. Redirect gated routes to your login — `provideUnauthorizedRedirect`

**When it fires:** every time a navigation targets a gated content route whose `access` the current
session does not meet. That covers a deep link on first load, a tab click, and an in-app
`navigateContent`. It also fires *live*: if the session changes while the visitor is standing on a
gated route (a role drop, a sign-out in another tab), the shell re-runs the navigation and the
handler fires again. It is **route-only**: hidden chrome items never trigger it.

Without this provider, the unauthorized visit shows the host's neutral "sign-in required"
placeholder **at the same URL** — fine as a default, but it is not your branded login. The handler
receives the attempted path (URL segments without a leading slash or query string, e.g.
`admin-area` or `doc/42`) and returns an in-app URL to go to instead — or `null` to keep the
placeholder for that route:

```ts
// src/app/app.config.ts — in the providers array
import { provideUnauthorizedRedirect } from '@loomweaver/shell';

// In your bootstrap providers, next to provideAuthSource:
provideUnauthorizedRedirect(
  (attemptedPath) => `/login?from=${encodeURIComponent(attemptedPath)}`,
),
```

The `from` parameter closes the loop with the login page from step 2: after a successful sign-in the
page navigates back to `'/' + from`, and the guard — now met — lets the visitor through.

The decision can differ per route; returning `null` keeps the placeholder for routes where an
in-place message is the better UX:

```ts
// src/app/app.config.ts — in the providers array
provideUnauthorizedRedirect((attemptedPath) =>
  attemptedPath.startsWith('admin')
    ? `/login?from=${encodeURIComponent(attemptedPath)}`
    : null, // every other gated route keeps the in-place placeholder
),
```

**Dialog instead of a page:** the handler returns only URLs, so route the redirect at a small
ungated "gate" surface whose component opens your sign-in dialog (shape B above) and resolves the
outcome — forward on success, home on dismiss:

```ts
// src/lib/plugin/notes.plugin.ts — in activate(ctx)
ctx.registerSurface({
  id: 'app.signInGate',
  title: 'app.signIn.title',
  routable: { path: 'sign-in-gate' },
  component: SignInGateView,
});
```

```ts
// src/lib/views/sign-in-gate-view.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from '@loomweaver/shell';
import { SignInDialog } from './sign-in-dialog';

@Component({
  selector: 'app-sign-in-gate-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="py-12 text-center text-sm text-content-muted">Sign-in required…</p>`,
})
export class SignInGateView {
  private readonly router = inject(Router);
  private readonly from =
    inject(ActivatedRoute).snapshot.queryParamMap.get('from') ?? '';

  constructor() {
    void inject(DialogService)
      .open(SignInDialog, { title: 'Sign in' })
      .closed.then(() => this.router.navigateByUrl('/' + this.from));
  }
}
```

with `provideUnauthorizedRedirect((path) => '/sign-in-gate?from=' + encodeURIComponent(path))`. If
the visitor dismissed the dialog without signing in, the navigation to `'/' + from` simply runs into
the guard again and shows the placeholder — no loop, because the gate route itself is ungated.

**Client-side gating is presentation, not security** — your own backend is the real boundary, and a
hidden control is a UX affordance, not an access check. Auth gating (what a *user* may see) is orthogonal
to capability grants (what a *plugin* may do, above).

## Persistence stores (optional)

The shell persists its user-local state through **two** ports of the same `KeyValueStore` shape,
split by what the data *is*:

- **`SETTINGS_STORE`** carries genuine **settings** — deliberate decisions: theme, language, text
  size, plugin settings, installed/disabled plugins, capability revocations and the
  saved-workspaces list. Rare, small, roaming-worthy writes; this is the port you back with your
  product backend.
- **`WORKING_STATE_STORE`** carries **working state** — what accrues from using the app: view state
  and view instances, the palette's recently-used list, and the window-local layout keys (pane
  trees, panel sizes, collapse state, item order, view placement). Frequent debounced writes; it
  defaults to the device and usually stays there.

The split is structural: nothing but settings can ever reach your settings backend, no matter what
keys the shell adds later. Both ports default to `localStorage`, so the bare platform and tests
need no wiring. A distribution that wants **settings** to follow the user across devices (or be
tenant-scoped) provides its own settings store — e.g. one backed by your own backend over `/api`
(the platform ships no server; the backend is yours):

```ts
// src/app/http-settings-store.ts
import { inject } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { provideSettingsStore, type KeyValueStore } from '@loomweaver/shell';

// provideSettingsStore(Class) constructs the class inside the injection context,
// which is what makes the field-level inject() here legal.
class BffSettingsStore implements KeyValueStore {
  private readonly http = inject(HttpClient);

  get(key: string): Promise<string | undefined> {
    return firstValueFrom(this.http.get(`/api/settings/${key}`, { responseType: 'text' }));
  }
  set(key: string, value: string): Promise<void> {
    return firstValueFrom(this.http.put(`/api/settings/${key}`, value)).then(() => undefined);
  }
  delete(key: string): Promise<void> {
    return firstValueFrom(this.http.delete(`/api/settings/${key}`)).then(() => undefined);
  }
  // No `peek`: a network store can't answer synchronously — the shell hydrates asynchronously and,
  // for bootstrap-critical values (theme/language), reconciles once the store resolves. Own Transloco's
  // `defaultLang` yourself if you need the very first render in the user's language.
}

// in the bootstrap providers — don't forget the HttpClient itself:
provideHttpClient(),
// place AFTER provideShell() — last provider for SETTINGS_STORE wins:
provideSettingsStore(BffSettingsStore),
```

`KeyValueStore` is a plain string key-value shape (`get`/`set`/`delete`, optional synchronous
`peek`); callers serialise/validate their own payloads. The same shape backs the working-state
port: `provideWorkingStateStore(...)` swaps it for a backend-backed one when working state should
travel across devices — a fresh tab then continues where another device left off. For *live*
cross-device updates, pair that store with a push transport (SSE, WebSocket) and call
`StateSyncService.notifyRemoteChange(key)` when your backend reports a change; conflicts stay
last-write-wins per key (state convergence, not collaborative editing).

**A rejecting store is safe.** Prefer resolving with `undefined` over rejecting — but the store above
rejects as written, because `firstValueFrom` on a 401 does. The shell therefore treats a rejected `get`
as "no value" everywhere it reads: the setting falls back to its default instead of leaving an unhandled
rejection. The user silently loses that setting, so a store that answers `undefined` on an expected miss
and rejects only on real faults still gives you the better signal.

**The boot never overwrites your saved layout.** With a `peek`-less store the pane tree
(`lw.shell.pane-trees:<workspaceId>`) loads asynchronously, so the shell holds back every layout write until that load
resolves — a tab auto-opened by the boot navigation cannot persist a half-empty tree over the real one,
and if the load *fails* nothing is written at all (a rejection is not an empty layout). A failed first
load is retried once after a short delay to ride out a transient fault; if that retry also fails the
shell keeps layout writes disabled for the session rather than overwrite a tree it never read. Once the
tree resolves, an auto-opened deep-link tab is reconciled back into it rather than dropped, and a deep
link survives a programmatic redirect during boot (only a real back/forward navigation abandons it).

### Storage-key inventory

The shell persists its state under the keys below. This list is authoritative — a distribution that
swaps or wraps the store (for example to scope state per signed-in identity) keys its decisions off
it. Each key has three independent axes. **Port** — which store it flows through.
**Scope** — **device** keys hold preferences that reasonably stay with the browser. Every other key
holds **identity** state. With the default `localStorage` store on a shared browser, identity state
survives sign-out and reload, and is re-hydrated for whoever uses the app next. **Sync** — a
**synced** key follows across the app's other windows of the same origin live (cross-tab sync,
below). **Per-window** keys stay local, so two windows can look different. The
layout keys are per-window on purpose — and they share **one** persisted slot per workspace: the
window that last changed its layout shapes the next boot (a permanently different setup is its own
workspace). The layout keys are sliced **per workspace** (`…:<workspaceId>`; the built-in default
workspace uses the id `default`), so a backend store never re-uploads every workspace on one change.
Two keys deserve extra care: `lw.shell.pane-trees:<workspaceId>` serialises
each tab's `path`, **literal `title`**, `icon` and `instance` in clear text, and
`lw.plugin-settings:*` carries plugin-owned data.

| Key | Holds | Port | Scope | Sync |
| --- | --- | --- | --- | --- |
| `lw.shell.theme` | light/dark choice | settings | device | synced |
| `lw.shell.lang` | active language | settings | device | synced |
| `lw.shell.font-scale` | text-size setting | settings | device | synced |
| `lw.shell.active-workspace` | id of the active workspace | working state | identity | per-window |
| `lw.shell.pane-trees:<workspaceId>` | pane/tab layout of every dock, incl. per-tab path/title/icon/instance, the **order of each pane's tabs** and which pane carries the URL (per-dock `{ tree, primary }` — pane ids are stable, the URL role is the pointer) | working state | identity | per-window |
| `lw.shell.hidden-views:<workspaceId>` | which sidebar views that workspace hides | working state | identity | per-window |
| `lw.shell.rail-items` | which rail entries the user hid, and which rail each one sits in | settings | identity | synced |
| `lw.shell.panels` | which sidebars the user collapsed | working state | identity | per-window |
| `lw.shell.panel-sizes` | sidebar widths | working state | identity | per-window |
| `lw.shell.item-order` | user reorder of rail items and sidebar views (content tabs order on their pane, above) | working state | identity | per-window |
| `lw.shell.workspaces` | user-defined workspaces — name + saved baseline | settings | identity | synced |
| `lw.shell.view-instances:<viewId>` | named saved instances of a view | working state | identity | synced |
| `lw.shell.view-state:<instanceId>` | a view instance's opaque `VIEW_STATE` blob | working state | identity | synced |
| `lw.shell.disabled-plugins` | plugins the user turned off | settings | identity | synced |
| `lw.shell.capability-revocations` | user capability revocations | settings | identity | synced |
| `lw.shell.installed-plugins` | community plugins installed at runtime | settings | identity | synced |
| `lw.shell.command-mru` | recently used palette commands ("Recently used" section) | working state | identity | synced |
| `lw.plugin-settings:<pluginId>:<sectionId>` | a sandboxed plugin's settings values | settings | identity | synced |
| `lw.plugin-state:<pluginId>:<key>` | a plugin's own working state (`ctx.state`) | working state | identity | synced |
| `lw.plugin-state-keys:<pluginId>` | which keys that plugin has used, so an uninstall can delete them | working state | identity | synced |

Two resets divide this table between them. `shell.workspace.reset` clears the two
`<workspaceId>`-scoped keys of the active workspace; **`shell.app.reset`** clears
`lw.shell.rail-items`, `lw.shell.panels`, `lw.shell.panel-sizes`, `lw.shell.item-order` and every
`lw.shell.view-instances:*` with the `lw.shell.view-state:*` blobs behind them. Everything else in the
table is a choice rather than an arrangement, and neither reset touches it.

The shell does not namespace these keys by user or tenant itself — scoping is a distribution
decision, made at the seams above (`provideSettingsStore` / `provideWorkingStateStore`, or the
identity wrapper below). The **sync** axis is likewise handled for you: the shell registers each
synced key with `StateSyncService`; a distribution only wires its own keys (below).

### Identity-scoped stores (multi-user browsers)

With the default store on a shared browser, one user's identity-level state (pane trees with
clear-text tab titles, workspaces, plugin settings) is re-hydrated for whoever signs in next. A
distribution with a real login scopes it per identity with the built-in wrapper instead of
hand-rolling one:

```ts
// src/app/app.config.ts — in the providers array
import { provideIdentityScopedStores, DEVICE_LEVEL_KEYS } from '@loomweaver/shell';

provideIdentityScopedStores({
  // Synchronous discriminator — null/undefined/'' = anonymous (keys stay unscoped, exactly the
  // default behaviour). Typically your session's stable subject; encode the tenant into it if
  // tenant switches should separate state. Read it from a synchronous cache (below), NOT from an
  // async session restore.
  identity: () => localStorage.getItem('acme.last-subject'),
  // Optional: exact keys that stay device-level. REPLACES the default — spread to extend:
  deviceKeys: [...DEVICE_LEVEL_KEYS, 'acme.kiosk-mode'],
  // Optional: the stores to wrap (your backend-backed ones). Both default to localStorage.
  // The instances are constructed OUTSIDE the injection context — keep them inject()-free
  // (a fetch-based store qualifies; the HttpClient-based BffSettingsStore above does not).
  settingsStore: new FetchSettingsStore(),
  // workingStateStore: new FetchWorkingStateStore(),
});
```

The wrapper covers **both** persistence ports with one shared boot latch — another user's view
state and layout are scoped away exactly like their settings. Never list `provideSettingsStore`
*next to* this provider — both fill the same `SETTINGS_STORE`
token, the later silently discards the other. One port, one provider; the composition with a
remote store is worked through in
[backend integration → One port, one provider](backend-integration.md#putting-it-together).

While signed in, identity-level keys are stored as `lw.id.<identity>:<key>`; device keys and the
anonymous session keep the plain keys, so a distribution without auth is untouched. The shell peeks
bootstrap-critical keys before first paint, so `identity()` must answer synchronously at boot —
persist the last-known subject yourself whenever your session resolves, e.g.:

```ts
// wherever your session becomes known (login success, session restore):
localStorage.setItem('acme.last-subject', session.subject);
// and clear it on sign-out:
localStorage.removeItem('acme.last-subject');
```

Pair the store with `provideAuthSource(..., { onIdentityChange: 'reload' })` so a user switch
re-hydrates cleanly (see [Auth integration](#auth-integration-access-gating)).

The stores **latch the first non-empty identity per boot** and never follow a live switch. A change
to a *different* subject only takes effect through the reload boundary. Writes still in flight
during the login transition — a pending debounce, a commit from the closing login dialog — therefore
land in the departing user's namespace, never the next user's. The anonymous→first-sign-in upgrade
— which deliberately never reloads — still re-latches once; after sign-out the latch keeps pointing
at the signed-out user for the rest of the boot. Return the live session's subject; the store owns
the latching.

### Cross-tab live sync

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
[recipe 9 in Samples](samples.md#sync-your-own-state-across-browser-windows).

A backend with a push transport rings the same bell for its **own** window:
`sync.notifyRemoteChange(key)` runs the registered applier locally, reading the fresh value back
through the registered store — that is the live tier of a cross-device working-state store.

An applier must set its state **without persisting again**, or two windows would write back and
forth forever.

### Pop-out windows

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
[authoring a weaver](authoring-a-weaver.md#sub-routes-and-pop-out-windows).

## Frame plugins

`providePlugins(...)` loads **trusted, in-process** weavers (Angular, composed at build time). A
distribution can also load a **sandboxed** plugin — code it does not fully trust, or that is not Angular
— with `provideFramePlugins(...)`. Its code runs in an isolated `<iframe sandbox>` and receives `ctx`
over RPC (Penpal), through the **same** default-deny broker:

```ts
// src/app/app.config.ts — in the providers array
import { provideFramePlugins } from '@loomweaver/shell';

// in providers:
provideCapabilityGrants({ 'report-tool': ['contributions', 'ui', 'navigation'] }),
...provideFramePlugins({
  id: 'report-tool',
  name: 'Report tool',                  // what the user reads; omit it and the id is shown
  entryUrl: '/report-tool/plugin.html', // the plugin's entry document, served by the distribution
  capabilities: ['contributions', 'ui', 'navigation'],
}),
```

`name` is what the workbench calls the plugin wherever it names it to the user — the permissions
surface above all. Omit it and the id is shown unchanged, which is a poor name but a correct one:
nothing prettier is derived from it. Everything else keeps following the `id`, so naming a plugin
changes what is read and nothing about what it holds.

What the entry document itself must contain — the Penpal handshake that receives `ctx` — is worked
through with a complete example in
[authoring a weaver → the sandbox bootstrap](authoring-a-weaver.md#the-sandbox-bootstrap--how-a-sandboxed-plugin-gets-ctx).

Grants work identically (default-deny, same map). The plugin contributes content views with the
[`iframe` route surface](authoring-a-weaver.md#content-area--routes--tabs). A
plain-string, data-oriented `ctx` slice crosses the boundary; an Angular class cannot. Everything
arriving over the wire is re-validated at the RPC seam. Only the `{ iframe }` surface form is
accepted. The surface URL must be **same-origin** (distribution-served) — foreign origins,
`javascript:` and `data:` URLs are rejected. This is the **first sandbox
rung** — the exposed `ctx` is currently minimal (routes, navigation, toasts) and grows as the rung
matures, so treat it as experimental. The isolation guarantee is the iframe sandbox: the plugin runs in
its own JS context and origin, with no access to the host DOM, variables or storage.

Because a sandboxed surface has none of the host's `--lw-*` design tokens, the host **pushes the resolved
token values** to the surface (alongside the active locale and light/dark theme); the surface sets them as
CSS variables and paints with `var(--lw-…)` just like host chrome. The push carries the **full `--lw-*`
vocabulary** (every `LW_TOKENS` entry), and the values are the *effective* ones, so
a theme switch — and any tenant/product token override, plus the user's text size — carries into the sandbox
with no hardcoded colours or fonts to keep in sync.

### Frame UI kit (`@loomweaver/frame-kit`)

Frame surfaces paint with the host's primitives through the **frame UI kit**: a small
npm package of static assets — `lw-elements.global.js` (the whole `<lw-*>` element family + the built-in
icon set + the `LwFrame` helper API), `lw-frame.css` (the `.lw-*` class contracts compiled to plain
CSS on `var(--lw-*)`) and `penpal.global.js` (the RPC transport). The **distribution serves it
same-origin under the well-known path `/frame-kit/`** with an assets glob:

```jsonc
// project.json → build.options.assets
{ "glob": "**", "input": "node_modules/@loomweaver/frame-kit/dist", "output": "frame-kit" }
```

Plugins reference those paths instead of vendoring copies — so the kit's version always matches the
`@loomweaver/shell` your distribution actually runs (`@loomweaver/frame-kit` shares the platform's version line;
keep the two in lockstep when you update). If you host sandboxed plugins — composed or through the
plugin store — serving the kit is part of the contract those plugins rely on.

The **session is pushed the same way, but only when you grant it.** A surface whose plugin holds the
`session` capability receives `{ authenticated, roles }` and can gate its own UI; without the grant the
host omits the field entirely — default-deny reaches the sandbox surface, not just `ctx`. Revoking the
capability in the Permissions settings stops the push live, with no reload.

Ship a Content-Security-Policy `<meta>` in your `index.html` with at least `frame-src 'self'` (both
in-repo distributions do — plus `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`): it pairs
with the same-origin surface check at the RPC seam as defense in depth for sandboxed surfaces. Angular's
component styles need `style-src 'unsafe-inline'`.

**`frame-src` is yours to decide, and it is the real gate for trusted embeds.** A *sandboxed* plugin can
never choose the origin — the RPC seam rejects anything not same-origin. A *trusted* weaver, however, may
point an [`iframe` surface](authoring-a-weaver.md#content-area--routes--tabs) at a foreign
origin on purpose (a Grafana dashboard, a docs site, a video), and that is an intended capability, not a
defect: the platform does not second-guess code you compiled in. What stops it is your CSP, which the
browser enforces and no plugin can talk around. So with `frame-src 'self'` such a surface is simply
blocked — if you want it, widen `frame-src` deliberately to the origins you trust, and no further.

> **CSP × production build — `inlineCritical` must be off.** With a strict `script-src 'self'` (no
> `'unsafe-inline'`/`'unsafe-hashes'`), Angular's critical-CSS inlining has to be **off** in the
> production build: `optimization.styles.inlineCritical: false`, in the build target's `production`
> configuration. Otherwise Angular emits the full stylesheet as
> `<link media="print" onload="this.media='all'">` and the **inline `onload` handler is blocked by the
> CSP** — the stylesheet never activates and the app renders unstyled. **The scaffold sets this for
> you**; it is written down here because it is invisible in `ng serve` dev builds, which do not inline
> critical CSS, so a hand-wired policy meets it for the first time in production. Verify against a
> production build.

## Plugin store (runtime install)

`provideFramePlugins(...)` composes sandboxed plugins at build time. On top of that, a distribution
can offer a **plugin store**: a curated catalog of sandboxed plugins the *user* installs at runtime —
no rebuild, no reload:

```ts
// src/app/app.config.ts — in the providers array
import { providePluginCatalog } from '@loomweaver/shell';

// in providers, after provideShell():
...providePluginCatalog('/plugins/catalog.json'),
```

The catalog is a same-origin JSON array; each entry (`PluginCatalogEntry`) is the installable part —
`InstalledPlugin`, the same shape `provideFramePlugins` takes and the shape that is persisted once
the user installs it — plus display metadata for the store:

```json
[
  {
    "id": "report-tool",
    "name": "Report tool",
    "author": "Jane Weaver",
    "category": "Productivity",
    "description": "Generates weekly reports.",
    "version": "1.0.0",
    "downloads": 12842,
    "updated": "2026-07-15",
    "repository": "https://github.com/acme/report-tool",
    "readmeUrl": "/report-tool/README.md",
    "iconUrl": "/report-tool/icon.svg",
    "entryUrl": "/report-tool/plugin.html",
    "capabilities": ["contributions", "ui"]
  }
]
```

**Check the catalog before you ship it.** Everything below is parsed defensively — an unrecognised
field is skipped, a malformed one dropped, an entry without `id` or `entryUrl` discarded, all
silently, because a store that throws on one bad entry serves nobody. That makes a typo invisible
until a user notices something missing, so run the validator in the pipeline that publishes it:

```bash
npx @loomweaver/cli validate-catalog --file public/plugins/catalog.json --strict
```

It reports what the host will actually do — an unknown capability is filtered out and the plugin
then throws `CapabilityError`, a missing `version` means the store can never offer an update — and
`--strict` turns the warnings into a failing exit code. See
[scaffolding](scaffolding.md#the-cli--loomcli).

Providing a catalog adds the store's entry points: a **Plugin store** settings section (id
`setting:shell.pluginStore`, `omit`-able) that — the Obsidian settings model — shows the
**searchable installed-plugins list right on the page** (per plugin the icon actions: open its
settings · uninstall [with a danger-toned confirmation] — both tooltipped — and the standard enable/disable switch) next to a Browse button; that button — and
the palette command `shell.openPluginStore` — opens the **store dialog**, a wide two-pane browse
surface modelled on
Obsidian's community-plugins browser: a **searchable list** (name, author, category and description
are matched; each card shows the plugin icon, name, author, category badge, download count, a
**relative** last-update time — "2 days ago", localized — and the short description, plus an
*Installed* badge) and a **detail pane**. The detail pane shows the metadata, a plain external `repository` link and
the plugin's **README rendered in-app**. The README is fetched from the same-origin `readmeUrl` and
sanitized. Like Obsidian — which pulls the author's README from GitHub and renders it inside the
app — the detail view never embeds a foreign page. A second, equally searchable **Installed** view manages
what is installed: per plugin an icon-action row (open its *Community plugins* settings section ·
enable/disable · uninstall — all tooltipped) plus an **Update to vX.Y.Z** button whenever the catalog
carries a newer version. `iconUrl` is a **same-origin image** the operator
ships with the plugin (a not-yet-installed plugin cannot contribute registry icons); `category` is
your curated taxonomy; `downloads`/`updated` are display-only operator stats. All metadata is
parsed defensively (a foreign-origin `readmeUrl`/`iconUrl` or a non-http `repository` is dropped,
the entry stays). Both the settings dialog and the store dialog are near-full-height, and every
dialog can offer a **maximize** control (`OpenOptions.maximizable`; bare dialogs draw their own via
`DialogRef.toggleMaximized`). **The store is the management surface** for installed plugins; brand its
title per product with `providePluginCatalog(source, { title: 'product.marketplace' })` (a Transloco
key you own). Installing shows a **consent dialog listing the
declared capabilities**, with the plugin's description and an icon. Accepting grants exactly that
declaration. For installed plugins the user's consent therefore replaces the
`provideCapabilityGrants` map; that map keeps governing your composed plugins. Afterwards the normal lifecycle applies: installed
plugins appear in the **Permissions** section like every plugin (on/off toggle + capability
switches), an install spawns the plugin immediately, an uninstall in the store unloads it live, and
the installed set persists through the [settings store](#persistence-stores-optional) — user-local by
default, tenant- or server-held when your store backend decides so.

**Updates** ride on the catalog's `version` field. Raise it (together with the entry's files) and
every installed user sees an *Update available* badge in the store list and an **Update to vX.Y.Z**
button in the detail pane and the installed list; pressing it swaps the persisted entry and respawns
the plugin live — no reload. The respawn re-creates the plugin's iframe, so the browser re-fetches the
entry document under your **cache headers**: serve plugin files so they revalidate, or an updated
plugin can come back from cache as the old build. Versions are compared segment by segment, numerically (`1.10.0` beats
`1.9.0`; a pre-release suffix is not ordered), and only a strictly newer version is offered, so
pinning a catalog back never nags the user. If the new version **declares capabilities the user never
consented to**, the update asks again and lists exactly the added ones — the persisted entry *is* the
grant for installed plugins, so an update can never widen it silently. A version that asks for no
more than before applies straight away.

The settings nav separates plugin *settings* by provenance (the Obsidian model): sections your
composed weavers register group under **"App plugins"** (they ship with the app), while an installed
plugin that [declares its own settings](authoring-a-weaver.md#settings-sections)
gets its own entry under a **"Community plugins"** group — the host stamps the group, a plugin cannot
choose it, so a community plugin can never masquerade as part of the app.

The curation is yours and happens **before** the frontend: whatever is not in the catalog does not
exist for the shell. Everything stays same-origin — the catalog URL, each `entryUrl`, and every
surface a plugin registers. The RPC seam enforces this. "Reviewing a plugin" therefore means *you
copy its files into your own origin*. That copy is the integrity boundary. Entries are parsed defensively (junk
shapes, foreign-origin URLs and unknown capability names are dropped), an installed id can never
shadow a composed plugin, and the persisted install set is re-validated on every load. Per-tenant
curation = your backend answering the catalog request tenant-dependently; for a non-JSON source,
provide your own `PluginCatalog` implementation instead of a URL.

## Icons

The shell ships a small first-party icon set. `provideIcons` — re-exported from `@loomweaver/shell` —
does two jobs: it adds names the shell lacks, and it **replaces** the ones it ships, which is how a
product re-skins the workbench in its own hand:

```ts
// src/app/app.config.ts — in the providers array
import { provideIcons } from '@loomweaver/shell';
import { heroDocumentText } from '@ng-icons/heroicons/outline';

// in providers:
provideIcons({
  report: heroDocumentText,          // a name we do not ship
  brandMark: '<svg …>…</svg>',
  trash: '<svg …>…</svg>',           // replaces ours everywhere the chrome draws it
}),
```

Values are `@ng-icons` refs or raw SVG strings. Naming one of the shipped icons replaces it in the
rail, the sidebars, tabs, menus, dialogs, settings and the command palette, and it also travels into
**sandboxed surfaces**, so a plugin drawing `<lw-icon name="trash">` shows your glyph rather than
ours and one screen never carries two icon sets. The key type suggests the shipped names, so a typo
in an intended replacement shows up while you write it instead of quietly adding a glyph nothing
draws; `LoomIconName` is exported if you want to name them in your own code.

A **weaver** instead brings icons at runtime with
[`ctx.contributeIcons`](authoring-a-weaver.md#custom-icons--ctxcontributeicons), and a weaver
contribution can never shadow a first-party or distribution name — otherwise an installed plugin
could repaint your chrome.

## i18n

Three layers compose, and none can clobber another:

- **Host keys** come from `@loomweaver/shell` at `/i18n/{lang}.json` (serve them — see
  [getting started §5](getting-started.md)).
- **Each namespace** you register with `provideTranslationNamespaces('notes', 'product')` loads from
  `/i18n/<name>/{lang}.json` and nests under `<name>.*`. Your weaver owns `notes.*`; your branding
  owns `product.*`.

Serve the namespace files as assets (`public/i18n/notes/en.json`, `public/i18n/product/en.json`) and
copy the shell's host keys (getting-started §5). A namespace file does **not** repeat its namespace —
the loader nests it under the name:

```jsonc
// public/i18n/product/en.json
{ "tagline": "Weave anything" }   // → resolved as product.tagline
```

### Rewording the shell

Namespaces let you *add* strings and can never collide with a host key, which is what keeps a plugin
from renaming your Cancel button. Rewording the shell itself is the opposite job, so it is a separate,
deliberate opt-in: call `provideTranslationOverrides()` and serve
`public/i18n/overrides/{lang}.json`.

```jsonc
// public/i18n/overrides/en.json
{ "workspace": { "saveAs": "Save as" } }   // ours reads "Save as new"
```

The overlay is merged **key by key**, so you name only the strings you want to change and inherit
everything else — including every key a later release adds. That is the point: forking our bundle
would leave you quietly behind on each update. It is applied last, so it also reaches the strings of a
weaver you bundle.

In development the shell says something when the overlay cannot help: a language with no overlay file
keeps its shipped strings and is logged, and a key the overlay names but nothing ships is logged too,
since that is otherwise a string that simply never appears.

#### More than one wording in one build

`provideTranslationOverrides()` takes an optional directory, so a single build can carry several
wordings and pick one while composing — a white-label distribution serving three brands, or a demo
that switches product:

```ts
// src/app/app.config.ts
provideTranslationOverrides(`/i18n/overrides/${brand}`),   // → /i18n/overrides/acme/en.json
```

You probably do not need this. The default path is same-origin, so a product **with a backend** can
already serve different bytes there per tenant, which keeps the choice on the server where the tenant
is known. The argument is for the static case, where the bytes are fixed at deploy time and the choice
has to happen in the composition root.

## Recomposing host chrome

The shell seeds default chrome (theme toggle, language switcher, version, update badge). A
distribution can:

- **Replace** a default: register your own contribution with the **same id** (last-in wins).
- **Hide** a default: `provideShell({ omit: ['shell.language'] })`.
- **Move** a default: re-register it with the same id at the new spot.

Replace and move use the same mechanism, and a distribution does it **without a plugin** — the
`provideViews` / `provideRailItems` / `provideBarItems` providers register chrome directly (see
[host services → contributing chrome without a plugin](reference/host-services.md)). The in-repo
demo moves the update badge into the right sidebar's footer bar exactly like this:

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

### Command palette entry

The command palette is always reachable by shortcut (`mod+k`), but the shell places **no visible
entry** in the top bar. `provideCommandPaletteEntry()` adds one — a badge-styled affordance (search
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
renders like a plain bar item — otherwise it would grow the bar and quietly take that height off the
content area.

It uses the bar-item id `shell.commandPaletteEntry`, so `provideShell({ omit:
['shell.commandPaletteEntry'] })` removes it again. To show a shortcut anywhere else yourself,
`formatChord('mod+k')` returns the OS-correct display string (⌘K on macOS, Ctrl+K elsewhere) — the
same platform detection the shell uses, so you never duplicate the `isMac` regex.

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
registration wins — which is a registration order your composition root does not control.

The palette has **two entry points**, one component in two modes: `shell.commandPalette` (`mod+k`)
lists **commands**, and `shell.quickOpen` (`mod+p`) lists **content to navigate to** — every open tab
across all split content panes, plus every registered route you could open that takes no parameter
and is not `chromeless`, most recent first with a relative-time hint. Enter reveals the tab where it already lives (a tab in a
secondary split pane is activated in place, not re-opened in the primary); `→` opens that tab's
context menu. Both are host commands, so `omit` and rebinding work the usual way.

This covers **built-in menu entries** too: every standard entry carries the id
`menu:<commandId>` — e.g. `omit: ['menu:shell.tab.closeAll']` hides "Close all" from the tab context
menu while the command itself (palette, shortcuts) stays available; omit the command id as well to
remove the behaviour entirely. Registering a menu item with an existing id replaces that entry.
Tab menu: `menu:shell.tab.splitRight/.splitDown/.close/.closeOthers/.closeRight/.closeAll/.togglePin` ·
view menu: `menu:shell.view.moveToOtherSidebar/.stackBelow/.openInContent/.resetState`.

A menu entry whose `command:` id no longer resolves (you omitted the command, or it was never
registered) is **hidden**, not rendered as its raw id — so omitting a bare command id cleanly removes
it from the palette **and** the menu at once, rather than corrupting the menu entry.

The host's own **context-only** commands (`shell.tab.*`, `shell.view.*` — close / close-others /
split / stack / reset / …) are marked `paletteHidden`, so they never appear in the command palette
(they need a tab/view context the palette can't supply). Your weaver can set `paletteHidden` on its
own context-only commands the same way. A separate axis: commands are main-window-only by default and
declare `popout: true` to appear in a [pop-out window](#pop-out-windows).

### Curating the settings surface

`omit` covers **settings** too — so a distribution decides which settings its app shows. Settings are
addressed with a **`setting:` prefix**: a *section* id drops the whole section, a *row* id drops just
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
a settings id may coincide — `shell.language` is **both** the top-bar item and the General settings
row — so `omit: ['shell.language']` stays chrome-only and never silently strips the setting too. To
remove both, list both: `['shell.language', 'setting:shell.language']`.

Built-in settings ids — section `setting:shell.general` (rows `setting:shell.theme`,
`setting:shell.language`, `setting:shell.textSize`) and section `setting:shell.permissions`
(row `setting:shell.pluginPermissions`). Registering a section with an existing id **replaces** it
(last-in wins), so you can swap a built-in section for your own.

`omit` is a **lasting** filter — an id a plugin registers later at activation time stays hidden too.
(To *replace* a default rather than hide it, register your own contribution with the same id and do
**not** omit it.)

### Dropping a content route

A **routable** surface's route is omitted with a `route:` prefix and the **surface id**:

```ts
// src/app/app.config.ts — in the providers array
provideShell({ omit: ['route:testbed.retired'] }); // the weaver still ships it; this app does not want it
```

The route then appears in no tab strip, no pane target picker, and is never auto-opened on a deep-link.
Its URL still answers — with the host's neutral *"View not available"* placeholder, so a link shared from
another environment explains itself instead of silently bouncing to home. (Like the auth placeholder, it
covers the route's tab root; a deep-link into a *sub-route* of an omitted route falls back to home.)

Two things worth knowing:

- **Omit addresses the id, override addresses the path.** Two handles for two operations: `omit:
  ['route:testbed.retired']` drops the route, while registering *your own* surface on the same `path`
  replaces it (last-in wins) — use that when you want your own view at that URL rather than nothing.
  Read the id off the surface's `registerSurface` call; **do not guess it from the URL**. They often
  differ — a sandboxed plugin conventionally declares surface id `<pluginId>.view` while routing at
  `<pluginId>`, so the view at `/sandbox-rpc` is dropped with `route:sandbox-rpc.view`.
- **A route is not its triggers.** A rail item or command that navigates there is a *separate*
  contribution with its own id; omitting the route leaves it drawn (and dead). List them too.

## PWA & delivery

**PWA is the default, not a requirement** — the whole decision is one option:
`provideShell()` ships it on (installable app, offline shell, the update badge/toast), and
`provideShell({ serviceWorker: false })` turns it off. Turn it off whenever your build does not emit
a worker — the [scaffolded quick start](getting-started.md) wires the PWA side for you, the
[manual setup](manual-setup.md) deliberately starts without it.

`provideShell()` registers the service worker itself, inert in dev — **do not add
`provideServiceWorker` to your own providers.** That is why `@angular/service-worker` is a peer
dependency rather than an optional extra: the shell imports it, so your build needs it installed
whether or not you ship a worker.

What you supply is the build side, and only the first line is required for the update flow:

| | Where | Needed for |
| --- | --- | --- |
| `ngsw-config.json` + `serviceWorker` in the build target | project root · `angular.json` or `project.json` | the worker exists at all — without it, registration 404s |
| `manifest.webmanifest` + icons | `public/` | installability (home screen, standalone window) |

Build with the production configuration to exercise either; the update badge and toast read one
signal, so the version/update chrome works with no wiring.

**Two of those details decide whether the app is really installable and really offline, and neither
one fails a build.**

*Icons.* A manifest without an `icons` entry cannot be installed at all, and Chromium only offers
installation once the manifest names a **192 and a 512 raster** icon; an SVG is fine for the browser
tab and is what the scaffold points at, but it does not satisfy that check, and iOS ignores manifest
icons entirely in favour of an `apple-touch-icon` link. So ship `icon-192.png` and `icon-512.png`,
name them in the manifest, and add the `apple-touch-icon` link. Keep `purpose: "any"` and
`purpose: "maskable"` on **separate files** — a maskable icon is cropped to a circle or a squircle
and needs padding that an edge-to-edge mark does not have, so one file cannot be correct as both.

*Translations.* The shell fetches its UI strings at runtime, so an asset group that does not cover
them produces an app that installs, opens offline and renders **every label as its raw translation
key**. Nothing errors. Cache them explicitly:

```jsonc
// ngsw-config.json — alongside the "app" and "assets" groups
{
  "name": "i18n",
  "installMode": "prefetch",
  "updateMode": "prefetch",
  "resources": { "files": ["/i18n/**/*.json"] }
}
```

**No worker at all?** Pass `provideShell({ serviceWorker: false })`. Registration is skipped,
`UpdateService.enabled` reports `false` and no update is ever offered — the service injects
`SwUpdate` optionally, so nothing else changes. Use it whenever your build emits no
`ngsw-worker.js`; otherwise production logs a failed registration for a file that was never built.

The update chrome is honest about failures and long-lived sessions. A failed installation
(`VERSION_INSTALLATION_FAILED`, e.g. a hash mismatch after a broken deploy) raises a sticky
"update failed — reload" toast and flips the badge to a caution state instead of claiming the app is
current, and the shell checks for updates in the background (every 30 minutes and whenever the tab
becomes visible again), so a tab that stays open for days still learns about a deploy without a
navigation.

The two ways an update goes wrong are told apart, because only one of them a reload can fix:

| State | What it means | What the affordance does |
| --- | --- | --- |
| `UpdateService.updateFailed` | An update could not be installed. The worker is healthy and the client keeps running its current version. | Reloads, which retries the install. |
| `UpdateService.updateBroken` | The worker reported an unrecoverable state: its cached asset table no longer matches what the server serves. | Unregisters the worker, drops its caches, then reloads into a fresh registration. |

The distinction matters because a plain reload cannot leave the second state. The broken registration
would still control the next load and report the same failure, which is a loop the user cannot escape
from inside the app; they would have to know to clear the site's browser storage. A deploy that
removes the previous build's hashed files (anything using `rsync --delete`) is enough to put a client
there. Only the shell's own `ngsw-worker.js` and its `ngsw:` caches are touched, so a worker or cache
your product registered itself is left alone. Read `updateBroken` only if you want to word it
differently in your own UI; the built-in toast and badge already do.

**Validate the service worker against a build, never against the dev server.** The Angular dev
server transforms files per request. The bytes it serves therefore do not match the hashes in the
`ngsw.json` it emits from the same build. The worker verifies every asset against that manifest. So
serving the *production* configuration through `ng serve` makes each watch-mode rebuild end in
`VERSION_INSTALLATION_FAILED` — the sticky "update failed" toast, permanently, from a perfectly
healthy build. That failure is indistinguishable from a broken deploy by design (the client only
sees a hash mismatch), so do not paper over it in the update chrome: run the dev server with the
development configuration, where the shell never registers a worker, and exercise the PWA and
update flow against a served build instead. This repo does both, in both install roots: the platform
has `npm run start:testbed` and `npm run preview:testbed`, the demo has `npm start` and
`npm run preview`. Two details of that pattern are worth copying rather than rediscovering.

**Give the preview its own port.** A worker's scope is the origin, so a registration a preview leaves
behind keeps controlling the dev server on the same port and serves you the stale cached build
instead of your edits.

**Serve the preview over plain HTTP on `127.0.0.1`, not over HTTPS with a self-signed certificate.**
Browsers already count loopback as a secure context, so the worker registers with no certificate at
all. A self-signed one is worse than none here: the page loads, `isSecureContext` is `true`, and the
worker script fetch still fails the certificate check with "An SSL certificate error occurred when
fetching the script". Nothing registers, and the preview silently stops previewing the one thing it
exists for.

---

**Next:** [The plugin system](plugins.md) — the four ways in, capabilities and what the user controls ·
[Backend integration](backend-integration.md) — wiring your own backend behind the three seams.
