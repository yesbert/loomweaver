# Updating LoomWeaver

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `commands` · `plugin-store` · `accessibility` · `menus` ·
> `scaffolding`. Where this page and a specification disagree, the specification is right, and that
> is a defect in this page: change the behaviour there, then explain it here.

What a product built on LoomWeaver has to do when it moves to a newer release. Every release is
listed in the [changelog](https://loomweaver.dev/changelog/). This page names only what asks
something of you.

## How to update

**Move every `@loomweaver/*` package at once, to the same version.** The seven packages are released
together under one number, and `@loomweaver/shell` asks for exactly its own version of
`@loomweaver/plugin-sdk`. A product on two versions does not install.

```bash
npm install @loomweaver/shell@0.20.0 @loomweaver/plugin-sdk@0.20.0 @loomweaver/frame-kit@0.20.0
```

Add `@loomweaver/ag-ui` with the same version where the product drives itself with an agent. The
tooling (`@loomweaver/cli`, `@loomweaver/mcp`, `@loomweaver/devkit`) is fetched or installed at the
same version too.

**Read the section of every minor release you cross.** Before 1.0, a breaking change arrives in a
minor release (0.19 to 0.20) and a patch release only adds. The sections below say what changed,
who it reaches and what to do. Every minor release has one, also when it asks nothing, and its
release page opens with the same text.

**Then let the checks and the tests tell you what is left:**

```bash
npx @loomweaver/cli validate-commands --dir src
npx @loomweaver/cli validate-catalog --file public/plugins/catalog.json
```

The second applies only where the product serves a plugin catalogue. Build the product and run its
tests after that. A test that finds a workbench control by its accessible name is the most likely
to need a change.

## 0.21.0

### A parameter arrives decoded, and a path keeps the address's encoded form

Reaches you if a plugin reads route parameters or builds an address from a value.

Every `:param` value arrives decoded: `ctx.activeContent().params`, `paramMap` on a routed
component, the `params` a sandboxed surface is pushed and the `params` a tab address resolver
receives. Every path stays in the encoded form the address bar shows. Calling `decodeURIComponent`
on a parameter again is wrong, and it throws on a value like `50%`.

What to do:

- Remove any `decodeURIComponent` you call on a parameter.
- Write a value into an address with `encodeURIComponent`, also a value you read from a parameter.
  A `TabAddressResolver` returns an encoded address in the same way.

```ts
ctx.openContentTab({ path: `doc/${encodeURIComponent(doc.id)}`, title: doc.name, titleIsLiteral: true });
```

An address that no route declares belongs to no plugin, so the plugin of the home route no longer
owns it. A frame's navigation target with a dot segment or a backslash is refused.
[Putting a value into an address](weaver/content-area.md#putting-a-value-into-an-address) has both
forms field by field.

### Formatted text from a plugin carries no inline style and no form

Reaches you if a plugin renders Markdown with `lw-markdown` and puts HTML into it.

A `style` attribute is removed, and so are form controls and the attributes that send a form. The
text inside a removed control stays as plain text. A task-list item keeps its text and loses its
checkbox.

What to do: move styled or interactive markup out of the Markdown and into your own template.

### A tab's `onClose` runs when the last pane holding it lets it go

Reaches you if a plugin frees state in `onClose`.

It runs once, whichever way the tab left its last pane: its close control, `closeContentTab`, a
pane closing, a split undone, a container going or a reset of the active workspace. It does not run
while a split or a container still shows the tab, or when another workspace is shown.

What to do: free per-tab state there, and do not expect it while another pane still shows the tab.

### A close veto is also asked when a tab changes panes

Reaches you if a surface implements `surfaceBeforeClose` or holds unsaved work.

Moving a tab to another pane builds it anew there, so the workbench asks first. The unsaved-work
question and the surface's veto are asked on a move and on a hand-over to a neighbouring pane. A
refusal leaves the tab where it was.

What to do: write the veto for "this instance ends", not for "the tab goes away". A test that drags
a tab holding unsaved work now meets the question.
[Unsaved changes](weaver/unsaved-changes.md#surfacebeforeclose--veto-a-close-with-your-own-flow)
describes the hook.

### A frame plugin replaces only its own contributions

Reaches you if a product relied on a frame plugin overriding something another owner registered.

A frame plugin, composed, deployed or installed, that registers a route, a view, a menu entry or a
settings section under an id or address another owner holds is refused. The console names both.
The distribution and the plugins composed into it as its own code replace as before.

A content route is now replaced by its address, so `/orders`, `orders/` and `orders` are one
route. A catalogue entry cannot take the id of a plugin composed as the application's own code. A
menu heading's picture from a frame must be an http(s) address.

What to do: register the replacement from the distribution or from a plugin that runs in the page.
Rename a catalogue entry that collides with a composed plugin.
[Contribution ids and collisions](plugins.md#contribution-ids-and-collisions) has the rule.

### `ContributionRegistry.actionsOf` and `ownerOfSurface` are removed

Reaches you if the product reads the registry itself.

Both are replaced by `surfacesOf(id)`, which lists every registered surface under that id, each
with its `pluginId` and its actions. The calls `retitleSurface`, `updateSurfaceAction` and
`updateSurfaceBadge` reach only that owner's surface where a plugin id is passed, and every owner's
where none is.

```ts
const actions = registry.surfacesOf('orders').flatMap((surface) => surface.actions ?? []);
```

### A toolbar cell or a component in a bar with an unmet `access` is hidden

Reaches you if such a contribution declares `access` with the `disable` mode.

A toolbar cell and a component in a bar are hidden while the session does not meet their
requirement, whatever their mode, as their descriptions say. A host-drawn button keeps its mode.
What to do: nothing, unless a test expected the inert control.
[Access gating](reference/access-gating.md#where-it-applies) lists every kind.

### The frame kit's declarations extend the tag-name map

Reaches you if a sandboxed surface written in TypeScript declared the `lw-*` tags itself.

The kit's declarations merge `LwElementTagNameMap` into the DOM's own map, so `createElement` and
`querySelector` answer with each element's shape. A declaration of your own for the same tags now
conflicts. What to do: drop your own entries.
[Writing the surface in TypeScript](weaver/sandboxed-surfaces.md#writing-the-surface-in-typescript)
lists what the kit describes.

### A translation namespace named like a workbench group is dropped

Reaches you if a plugin contributes a namespace such as `workspace`, `retention` or `content`.

Such a namespace is dropped with a warning, because it would reword the workbench's own strings.
What to do: name the namespace after your plugin's id.

### `retention.closeAnyway` is now `retention.goAheadAnyway`

Reaches you if the product rewords the workbench or serves a language the workbench does not ship.

The escape in the slow-plugin dialog now reads "Go ahead anyway", because it also lets a move go
ahead. An override of `retention.closeAnyway` is no longer shown. The release also adds
`retention.moveDropped`, `content.loadFailed`, `route.pluginFailedMessage` and
`workspace.changedMark`, and `retention.vetoPendingMessage` has new wording.

What to do: move your override to `retention.goAheadAnyway`. Translate the new keys in a language
file of your own, where they are shown in English until you do.
[Rewording the shell](distribution/icons-and-i18n.md#rewording-the-shell) describes the overlay.

### `activateUpdate` may resolve without reloading

Reaches you if the product or a plugin calls `activateUpdate`.

It asks about unsaved work in this window before it applies anything. Where the user declines, the
update is abandoned and the promise resolves with no reload. What to do: do not put code after the
`await` that assumes the window is on its way out.

### A key something handled runs no command

Reaches you if the product binds commands to keys that also reach a field or a plugin's own handler.

A key event that was already handled (`preventDefault`) or is part of a composition runs no
command. In a text field, a key that types a character runs no chord, also with Alt or AltGr. So a
chord on Ctrl+Alt+Shift with a digit or a punctuation key does not run inside a text field. Escape
inside the compact drawer closes it unless the view prevented the key.

What to do: bind such a command to a key that does not type, and call `preventDefault` in a view
that handles Escape itself.

### Three palette values moved, and `caution` is not a text colour

Reaches you if a test compares colours or a stylesheet uses `caution` for text.

Light `negative` moves from `#d14343` to `#cc3333`, dark `negative` from `#e06464` to `#e47272`, and
light `caution` from `#b8841f` to `#b27f1e`. In the light theme `caution` stays below 4.5:1 as text.
What to do: use `caution` as a fill or an icon and write the words beside it in `content`.
[Design tokens](reference/design-tokens.md#states) has the table.

### An agent connection forgets open calls when a run starts

Reaches you if the product uses `@loomweaver/ag-ui`.

A call left open by a run that broke off is neither run nor answered in the next run. A hook that
throws or rejects now refuses the call. A tool whose command has no description is no longer
described by its title.

What to do: put the `flush` loop in a `finally` around the run, and give each command an agent may
call a description. [Agent tools](reference/agent-tools.md#the-whole-integration) shows the loop.

### `init` in an Nx workspace refuses changed files

Reaches you if a script runs `loomweaver init` in an Nx workspace.

It refuses to replace a bootstrap file that is not what the `@nx/angular` 24 application generator
writes with default options. It names that file and stops before installing anything. It first
brings an installed `@loomweaver/devkit` to its own version. The application's `tsconfig*.json`
and `eslint.config.mjs` are never replaced.

What to do: run `init --dry-run` to see what it would create, replace or change. Wire a developed
application by hand, as [Manual setup](manual-setup.md) describes.

## 0.20.0

### An agent backend calls the tools by the names they were offered under

Reaches you if the product uses `@loomweaver/ag-ui`.

A tool is no longer named by its command id. A dot becomes two underscores, any other character a
model API refuses becomes one underscore, and a name longer than 64 characters is shortened with a
digest. `notes.open` is offered as `notes__open`. The adapter translates a call back to the
command itself, so the `before` hook still sees `notes.open`.

The connection runs only what it offered. A call naming anything else is answered with an error
and does not run, including a call by the command id.

What to do:

- Hand the names from `list()` to the model unchanged, and hand a call back under the name it came
  with. Remove any translation between command ids and tool names you wrote yourself.
- Where your own code starts a call, a scripted agent or a test, take the name from `toolFor` for
  the command rather than writing the command id.

[Agent tools](reference/agent-tools.md) has the whole contract.

### `@ag-ui/core` moves to 1.x

Reaches you if the product uses `@loomweaver/ag-ui`, which now asks for `@ag-ui/core` `^1.0.3` as a
peer.

```bash
npm install @loomweaver/ag-ui@0.20.0 @ag-ui/core@^1.0.3
```

In AG-UI 1.x the `content` of a tool message is `string | ContentPart[]`. Code that read it as a
string no longer compiles. Read it through `contentToText` from `@ag-ui/core`:

```ts
import { contentToText, type ToolMessage } from '@ag-ui/core';

const text = (answer: ToolMessage) => answer.error ?? contentToText(answer.content);
```

What the generators write already does this.

### A catalogue entry's id has a form, and `shell` is reserved

Reaches you if the product serves a plugin catalogue.

An id is lower-case letters, digits, dots and hyphens, and starts with a letter or a digit.
`shell` and every id that begins with `shell.` belong to the workbench. An entry outside that form
is refused when the catalogue is read. It is also dropped when the installed list is read back, so
a person who installed it under such an id no longer gets it started.

What to do: run `validate-catalog` over the catalogue. It names each entry it refuses and what that
costs. Give such a plugin an id in the form, publish it under that id, and tell the people who
installed it to install it again. [The plugin store](distribution/plugin-store.md#the-catalogue)
describes an entry.

### A menu entry that holds a submenu is drawn as a row inside a holder

Reaches you if a test or a stylesheet addresses such an entry.

The `lw-menu-item` that carries a submenu now has `role="none"`. The `menuitem` is the row inside
it, `.lw-menu-item-row`, as the WAI-ARIA menu pattern asks. An open submenu is also no longer part
of its entry's accessible name.

What to do: address that entry by its role and name (`getByRole('menuitem', { name })`) or through
`.lw-menu-item-row`, not as `lw-menu-item[role=menuitem]`.

### Workbench controls are named for what they show

Reaches you if a test finds a workbench control by its exact accessible name.

A control that draws text has an accessible name that begins with that text, followed by what the
control does (WCAG 2.5.3, Label in Name). The rail entry drawing initials is "NR, Account", the
view switcher drawing the current view is "Default, Saved views", and a palette entry names its
shortcut and announces it with `aria-keyshortcuts`. A minimised pane is named by the title and count
it shows, and a dialog without a title by its message.

What to do: update the names those tests look for. The same rule applies to your own controls, see
[Accessibility](reference/accessibility.md#rules-for-plugin-authors-checklist).

### `loadTypeScript` says why it found nothing

Reaches you if your own tooling calls `loadTypeScript` from `@loomweaver/devkit`.

It returns `{ ts }` where it found a compiler that can read sources, and `{ ts: null }` otherwise,
with `withoutInterface` naming the version it found where that TypeScript has no compiler
interface. It used to return the compiler or `null`. Where a project is on TypeScript 7, it reads
through `@typescript/typescript6` installed beside it.

### The generators refuse rather than overwrite

Reaches you if a script runs the generators.

- The Nx generators refuse an option they do not know, where they used to ignore it. A misspelled
  flag now fails.
- The Nx `weaver` and `distribution` generators refuse to write over a file that is already there,
  and every Nx generator refuses a directory outside the workspace.
- A dependency version the workspace already records is kept, also when it is older than the one
  the generator would record.
- `loomweaver init` replaces a file of an Angular CLI application only while it is still what
  `ng new` wrote. Where one was changed, it names that file and stops before installing anything.
  It writes into the application's own project root, which is no longer assumed to be the workspace
  root.
