> **Status:** approved.

## Why

An audit of the guides, the assistant-facing files, the tooling, the examples and the platform
source after the toolbar change found defects that pass every check today, and logic written two to
fifteen times over. The defects break guarantees the specifications already make: the same menu
resolves differently inside an isolated surface than in the page, an entry asking to be shown but
inoperable can be run, and generators emit output that does not compile or wire what it needs. The
duplicates have started to disagree with each other, which is how the next defects of this kind
arise.

## What Changes

In six slices, each its own pull request, in this order. Slices 1 to 3 fix defects; slices 4 to 6
change no behaviour.

**Slice 1 — a menu opened in a frame is the menu the page opens.**

- A menu an entry opens from a toolbar inside an isolated surface is resolved by the workbench
  exactly as the page resolves it: against the opening entry's description, without entries that
  have nothing to label them, and with the heading the entry declares. Today each entry is matched
  against its own identity, untitled entries are kept and the heading is lost.
- The surface no longer names the further slot itself: it reports which entry it opened, and the
  workbench answers with that entry's menu. The surface draws it with the same drawing the page
  uses, so groups are separated and the leading columns are reserved as in the page.
- An entry whose own requirement asks to be shown but inoperable is drawn inoperable in a menu,
  and cannot be run. Today it is drawn and runs.

**Slice 2 — what the seam and the report miss.**

- A sandboxed plugin's menu entry carries its own access requirement across the boundary, checked
  as data. Today it is dropped without a word, so an entry meant for administrators is drawn for
  everyone.
- The composition report names a routable surface's action that points at a command nothing
  registers, as it already does for a view's.
- An isolated surface's requests for its plugin's state are validated as the frame plugin's are,
  through one bridge instead of two copies.

**Slice 3 — generators and checks that do what they say.**

- Names and titles a consumer supplies are escaped where they land in generated code and markup.
- The Nx distribution generator records the frame kit dependency, as the command-line route does.
- `init` validates every option before it installs anything, and installs the platform packages at
  the version of the tool that writes their templates.
- The assistant route refuses an option it does not know, as the other routes do.
- The frame plugin scaffold uses the frame kit's current entry point, so its surface appears in a
  picture of the workbench and can fill a toolbar.
- The catalogue check knows every field the workbench reads, judges their values, and flags a
  protocol-relative address the workbench would refuse.
- The default shortcut a generated weaver claims no longer collides with chords browsers keep for
  themselves.

**Slice 4 — one implementation per job in the shell.** Keyboard roving, folding into a tray,
reading a stored value, coercing a menu description, registering a context-menu command with its
entry, asserting where a surface may live, and a handful of smaller helpers each get one owner;
the copies are removed.

**Slice 5 — one implementation per job in the tooling.** The workspace amendments the command-line
and Nx routes apply are planned once in the dev kit and only performed by each route. The docs-site
sync script keeps one link rewriter.

**Slice 6 — the demo and the testbed use what the platform ships.** The demo's payments surface uses
the frame kit's entry point and state store, the frame stylesheets drop their own palette, the
testbed's sandbox page uses the class contract, and the demo uses the shell's storage helper.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plugin-sandbox`: an isolated surface asks for the menu an entry opens through that entry, and is
  answered with the menu the page would open, heading included.

Every other item is a defect against a requirement the specifications already state, and is pinned
by a test rather than a new requirement: `access-gating` (a contribution may ask to be shown but
inoperable; anything a plugin contributes may declare a requirement), `platform-composition` (a
control pointing at nothing is named), `scaffolding` (generated output builds and needs no repair; a
package the output needs is met; a mistyped option fails; a consumer's declarations can be checked),
`workbench-capture` (a plugin's surface appears in the picture).

## Impact

- Shell: menu resolution and drawing, the toolbar slot service and the frame's slot bridge, the
  frame kit's toolbar host and its published declaration (the slot host gains a way to open an
  entry's menu; the slot entry loses the further slot's identity; the slot view may carry a
  heading), the RPC sanitizers, the composition report, the plugin state bridges, and the helpers
  named in slice 4.
- Tooling: the dev kit's recipes, generators and checks, the command-line `init` and wiring, the
  assistant server.
- Demo and testbed public frame plugins; the docs-site sync script.
- The frame kit's declaration changes shape before it is released; nothing published carries the
  slot host yet.
