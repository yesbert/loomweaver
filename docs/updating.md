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
