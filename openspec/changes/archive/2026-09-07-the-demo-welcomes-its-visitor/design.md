## Context

See `proposal.md` — Why. What the build stands on:

- **A plugin opens dialogs of its own.** `ctx.ui.open(component)` shows a component in the host's
  dialog frame; the demo's plugins run in the page, so the component is an ordinary demo component.
- **A plugin registers commands and settings sections**, and a settings section may hold a
  `component` row, so the About section can be the same component as the dialog's body.
- **The distribution composes the status bar** with `provideBarItems` and may leave a default entry
  out with `provideShell({ omit: [...] })`; the shell's version entry is `shell.version`.
- **The platform version is a fact a plugin reads** through `ctx.host`, and the distribution through
  the version service; the preview badge already does the latter.
- **A plugin has a private store** for what it remembers per browser, which is where "welcomed" goes.

## Goals / Non-Goals

**Goals:**

- One content, three ways in: first visit, status bar, settings.
- No test in the existing suite meets the dialog.

**Non-Goals:**

- No About the platform offers to every product. That is a product-identity question and gets its own
  change if a product asks.
- No change to the preview badge.

## Decisions

### One demo plugin carries all of it

Command, dialog, settings section and the first-visit rule belong together and change together, so
they live in one in-page plugin, `about`, declared with `contributions` and `ui`; the version is read
by the components through the distribution's version service, so the plugin needs no `host`. The status
bar entry is the one part the distribution places, because bar composition is the distribution's;
it is a component entry showing the info icon and the version, and its click runs the plugin's
command. The alternative of doing everything from the app config would put a dialog component and a
first-visit rule into the composition root, which composes and does not behave.

### The version entry is replaced, not duplicated

Two version numbers in one bar would be the kind of thing the welcome apologises for. The shell's
`shell.version` entry is omitted and the About entry carries the number in its place, at the same
slot and order, so nothing else in the bar moves.

### Welcomed is remembered in the plugin's own store

The plugin-private store is per browser and survives a restart, which is exactly the rule wanted:
once, here. The alternative of the shell's settings store would make a demo fact look like a shell
fact. The end-to-end suite seeds the same store key from its Playwright configuration, once for all
tests, and the one test that wants the dialog clears it first.

### The dialog is the settings body plus a heading and buttons

The About section in the settings is a `component` row rendering the same body as the dialog
(logo, paragraphs, version, documentation link). The dialog wraps it with the welcoming heading and
the "Got it" button. One component, no drift between the two texts.

### The documentation link opens a new tab

The visitor is in the middle of the demo; the docs are where they go next, not instead. `target`
new window with `rel="noopener"`, pointing at the documentation's front page.

## Risks / Trade-offs

- **A visitor who clears storage sees the welcome again.** → Fine: it is one dialog with one button.
- **The status bar reads slightly different with an icon before the version.** → Checked at the
  narrow viewports the suite already covers, since the bar folds there.
