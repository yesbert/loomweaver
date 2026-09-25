> **Status:** approved.

## Why

Reading every source file for readability (see `the-code-reads-for-a-newcomer`) turned up 44 places
where the code does not do what the contract, its own documentation or plain sense says. Most of
them sit exactly where the same knowledge is written twice and one copy drifted: the list menu hides
the check its sibling draws, the rail curation forgets the entry the rail shows, the sidebar's
keyboard move forgets the announcement the context menu makes. Each was reproduced from the code by a
second reader, and each platform defect was traced to the requirement it fails. They are fixed here,
test first, before the refactoring touches the same code, so the refactoring cannot hide them and
their tests guard it.

## What Changes

In the platform, each fix restores a promise the contract already makes or states one it should:

- A list menu marks its active entry and keeps every icon, as a command menu does.
- A plugin can rename, or replace an action of, only a surface it registered.
- A deployed plugin's settings are reachable from the list of installed plugins.
- The pane arrangement reads the saved-workspace list from the port it is written to.
- The stored language is applied from the product's settings port, including one that answers at
  once and a distribution without a language switcher.
- Two claims of different shape and equal narrowness are reported to the developer.
- Moving a view to the other sidebar with the keyboard is announced.
- A drag whose panel edge disappears ends, and the width reached is kept.
- Closing the pane that fills the area ends the blow-up.
- A launcher entry that only opens a menu can be curated and brought back.
- Actions chosen for open work in the search act in the pane that holds it, and closing there no
  longer drops the owner's teardown.
- Dragging between inner panes works for a container whose address holds a colon.
- A capability refusal thrown by a menu entry's own implementation reaches the user.
- A failed activation releases what the plugin was granted; a misspelled required-plugin id is
  reported in every composition.
- The frame kit's published declaration cannot carry an invalid statement; a pane body no longer
  keeps bookkeeping for every address it ever showed.
- The generators: notes that name only real regions and the recorded versions, app wiring that does
  not depend on the test runner, a forced distribution that keeps the occupant's build settings,
  silent paths that name what they left, the CLI finding the workspace above a nested package and an
  object-form stylesheet, one error printed once, and a path escaped before it becomes a pattern.

Outside the contract, in the testbed, the demo, the example and the website: typing in the RPC sandbox
keeps focus, the minimal store plugin loads its own page, the static sandbox page is styled, the
demo's month list is right east of UTC, commands accept quotes created after startup, the dashboard
releases its observer, the quotes plugin activates with storage blocked, the welcome waits for a
store that answers later, a lower-case ticket link opens its ticket, the landing page's pictures are
served on purpose, and the sidebar guard matches whole routes.

Further behaviours were chosen by the owner, because each fix is a choice (see `design.md`):

- The connection an agent drives answers every call a run leaves open, one per request, and refuses
  those whose arguments never arrived instead of running them.
- Only a command invoked from within another command's run counts towards the depth limit, so
  invocations waiting side by side no longer block an unrelated one.
- A plugin state value with no data form is refused with a message naming the plugin and the key.
- A plugin the operator deployed offers no install while browsing, and installing it is refused.
- On a narrow screen the plugin store's detail replaces the list and offers a way back.
- A plugin in the page is told when its stored value arrives, as an isolated plugin is; an isolated
  surface's write made before it is connected is sent once it is.
- The choices of a command registered by a plugin in the page are read whenever it is described or
  checked.

In the demo, cancelling the second "New customer" prompt cancels the creation, and an accepted quote
can no longer be sent. A select option shows its icon, not the icon's name.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `menus`: *An entry with a state keeps its icon* gains a scenario for the list of open tabs.
- `plugin-permissions`: *A refusal tells the user, and never locks them out* gains a scenario for a
  menu entry's own implementation; *A distribution may declare that a plugin is not optional* states
  what happens to a declaration naming a plugin that is not composed.
- `plugin-runtime`: *Activation is isolated per plugin* releases what a failed plugin was granted.
- `i18n`: *The starting language is resolved before the first paint* gains a scenario for a port that
  answers at once.
- `shell-layout`: *A panel can be collapsed and resized, and remembers both* gains the interrupted
  drag; *The user curates what lives in each rail and sidebar* gains the menu-only launcher entry.
- `commands`: *Open work is searchable in its own mode* states where the actions act; *A command may
  take described arguments and give an answer* states when choices are read; two requirements are
  added: *Invocations waiting side by side are not a chain* and *The connection an agent drives
  answers every call it opened*.
- `persistence-ports`: *A plugin has a private place to keep working state* gains the in-page
  observer told when a value arrives and the isolated write made before connecting; *A plugin's
  private store has limits, and refuses rather than degrades* refuses a value with no data form.
- `plugin-store`: *A deployed plugin is visibly not the user's* offers no install and refuses one;
  *Browsing is a list and a detail* keeps the detail reachable on a narrow screen.
- `panes`: *A pane can be blown up, and collapsed away* gains closing the blown-up pane.
- `containers`: *The inner arrangement behaves like the outer one* gains an address with a colon.
- `plugin-sandbox`: *The workbench's own controls are available inside an isolated surface* gains a
  description that raises nothing itself.
- `scaffolding`: *Generated output builds, passes its own checks, and needs no repair* gains the
  generated notes and a configuration the generator cannot amend; *A generator composes into what is
  already there* gains a nested package.

The defects already pinned by a scenario (the ports that do not read each other, equal claims
reported, rearranging without a pointer, renaming or replacing on a foreign surface, deployed
settings reachable, a generated plugin reaching its workbench, keeping the occupant's declarations,
the route that leaves nothing to be named, placement being the consumer's) need only their test.

## Impact

- `platform/libs/core/shell`: `menu/`, `plugin/`, `plugin-store/`, `regions/panel/`, `regions/pane/`,
  `regions/content/`, `regions/curation/`, `commands/`, `i18n/`, `workspace/`, `permissions/`.
- `platform/libs/core/frame-kit/build.mjs`, `platform/libs/integrations/ag-ui` (after the decision).
- `platform/libs/tooling/devkit` (generators, recipes, generated notes), `platform/libs/tooling/cli`.
- `platform/apps/loom-testbed/public/`, `demo/src/`, `demo/public/`,
  `examples/assistant-workbench/src/tickets/`, `website/tools/sync-docs.mjs`.
- Published JSDoc that describes the corrected behaviour: the `claims` field of a workspace
  definition, `provideRequiredPlugins`, the language service.
- `platform/libs/core/shell/src/lib/surface-kit/` (the frame kit's state), `plugin/`, `commands/`,
  `elements/select/`; `demo/src/customers/`, `demo/src/quotes/`.
- No published signature changes. One addition: the in-process state handle gains a change listener,
  as the frame kit's handle has. The published JSDoc of a command's choices stops calling them fixed,
  and the adapter's documented usage asks until nothing is answered.
