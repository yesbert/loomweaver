> **Status:** approved.

## Why

A plugin can already own a menu slot that other plugins fill: a launcher entry, a bar button or a
surface's action names the slot, anything registers entries into it, and the control appears and
disappears with what the slot holds. What a plugin cannot do is place such a slot inside its own
content, where its data is: every place that draws contributed commands today is either a frame
region the distribution declared or the header of a surface. A product that composes a weaver from
npm and wants to add its own entries, buttons and controls *beside that weaver's data* has no place
to put them, and the weaver has no way to offer one.

Underneath, the docks that draw contributed commands have grown apart. Menus and the command search
resolve an entry through the command it names: they take its title, icon and shortcut from the
command and drop the entry when the session may not run the command. Launcher entries, bar buttons
and surface actions each filter, sort and draw on their own, and each checks only the item's own
access requirement, never the command's. A rail entry pointing at a command the session may not run
is drawn, and refused only when pressed. One pull request fixed this for surface actions in a
detached window alone. The same question — "what does this slot offer, to this session, against
this thing?" — has five answers.

## What Changes

In three slices, each its own pull request, in this order.

**Slice 1 — one resolution, declared slots.** No new place to put anything; the existing ones
start agreeing with each other.

- Every place that draws contributed commands resolves them the same way: launcher entries, bar
  buttons, surface actions, the command search and menus all drop an item naming a command the
  session may not run, in the main window as in a detached one. This is a defect fix against the
  access-gating guarantee that the reaction to the session is uniform across the workbench.
- A menu slot is **declared**: by the workbench for its own, by a control that names it, by a
  toolbar a plugin registers. An entry contributed to a slot nothing declares is reported to the
  developer **after composition**, never at the moment of registration, because the plugin that
  fills a slot may activate before the plugin that owns it. The report joins the existing
  composition diagnostics.

**Slice 2 — a toolbar a plugin places in its own content.** A toolbar is a menu slot drawn open
and horizontal, the way an editor's title bar is in the reference workbenches.

- A plugin registers a toolbar under a slot of its own and places it, as many times as it likes,
  with the workbench's element, each instance carrying the description of what it stands beside.
  The entries are ordinary menu entries, so any plugin fills it with `registerMenuItem` exactly as
  it fills a menu, with the same `when` matching against that description, the same groups and
  separators, and the same command-derived title, icon and shortcut.
- An entry whose activation opens a menu works as it does on a bar button, so a toolbar carries
  nested menus without a second mechanism.
- A toolbar that cannot show every entry folds the rest into a control at its end, as a bar does.
- A plugin running in the page may contribute a **component cell** to a toolbar, the form the bar
  already offers beside its declarative button: the owner's own cells by placing them in the
  element, a foreign plugin's by registering them. A cell carries only an access requirement and
  an order, is folded whole, and is otherwise opaque to the resolution.
- A surface's actions become that surface's own toolbar on a slot named for the surface. The
  declaration on the surface keeps working unchanged, and other plugins may now add to a surface's
  header the way they add to a menu.

**Slice 3 — the toolbar inside an isolated surface.** The frame asks the workbench to resolve a
slot against a description and is told, reactively, what the slot offers: titles, icons, shortcuts,
states, and which entries open a menu. It draws the toolbar itself, with the elements it already
receives, and triggers an entry through the command invocation it already has. Declarative entries
only: a component cell never crosses the boundary, and the specification states that as the limit.

**BREAKING** in slice 1: a launcher entry, bar button or surface action naming a command the
session may not run is no longer drawn. A product that relied on a drawn-but-refused control sees
it disappear. This is the behaviour the specification already promised for menus and the search.

**Owner's decisions, taken 2026-10-03:**

- A foreign plugin may add to a surface's header, as it may to a view's title in the reference
  workbench. The alternative, keeping a surface's actions the owner's alone, was rejected.
- Every placed toolbar carries a name the plugin gives it, by which assistive technology announces
  it, because the workbench cannot know what a row of controls beside a record is for.

## Capabilities

### New Capabilities

None. A toolbar is a menu slot that is drawn differently, and belongs with menus.

### Modified Capabilities

- `menus`: a slot is declared, and an entry aimed at an undeclared one is reported; a slot may be
  drawn as a toolbar wherever a plugin places it, filled like a menu, folding like a bar, with
  component cells for a plugin in the page; a surface's actions are such a toolbar.
- `access-gating`: *Every surface that shows a contribution reacts to the session* gains the rule
  that an item naming a command the session may not run is not drawn, wherever it is.
- `plugin-runtime`: *A contribution aimed at a place that cannot render it is reported* covers a
  menu entry aimed at a slot nothing declares, reported after composition.
- `platform-composition`: *A composition can be asked what is wrong with it* lists the undeclared
  slot among the mistakes.
- `surfaces`: *A surface's actions are drawn wherever the surface stands* says the actions are the
  surface's own toolbar, open to contribution, and loses its sandbox limit for actions contributed
  by a plugin in the page.
- `plugin-sandbox`: an isolated surface may ask what a slot offers and is told reactively, and may
  trigger an entry; what it is told carries no code.
- `shell-layout`: *Each kind of region has a fixed anatomy* states that a toolbar is not a region
  and is not placed by the distribution, so that the rule about sub-slots is not read against it.

## Impact

- `platform/libs/core/shell/src/lib/menu/menu-resolution.ts` grows into the one resolution every
  dock reads; `shell/regions/rail/shell-rail.ts`, `shell/regions/bar/shell-bar.ts`,
  `shell/regions/bar/shell-bar-item.ts`, `shell/regions/content/actions/surface-actions.ts` and
  `shell/commands/palette/command-rows.ts` lose their own filtering and drawing.
- `platform/libs/core/shell/src/lib/diagnostics/composition-checks.ts`: the undeclared-slot report.
- `platform/libs/core/shell/src/lib/elements/`: a new element for the toolbar, registered with the
  others and served to frames by `platform/libs/core/frame-kit`.
- `platform/libs/core/plugin-sdk/src/lib/chrome/`: a toolbar registration and a toolbar component
  cell; `plugin/plugin-context.ts` gains the registration. The published `.d.ts` changes.
- `platform/libs/core/shell/src/lib/plugin/frame/rpc/frame-rpc-contract.ts` and the surface channel
  in `plugin/frame/iframe-surface.ts`: resolve-and-watch a slot (slice 3).
- `platform/libs/weavers/testbed-weaver` and `platform/apps/loom-testbed-e2e`: a toolbar fixture
  filled by a second plugin, one component cell, one isolated surface drawing a toolbar.
- `docs/weaver/menus.md`, `docs/weaver/content-area.md`, `docs/weaver/sandboxed-surfaces.md`,
  `docs/reference/design-tokens.md`, `llms-full.txt`.
- No legacy source is dissolved.
