## Context

See proposal.md for why. The audit's evidence, file by file, was gathered by six read-only passes
over the guides, the assistant files, the tooling, the examples and the platform source; jscpd
measured textual duplication at 0.14 % of platform lines, so what is worth removing is semantic
duplication a clone detector does not see.

Constraints that shape every slice:

- The frame kit is bundled from shell sources. Its implementation may import plain-DOM modules of the
  shell; its published declaration may import nothing, because it is emitted as a standalone script
  description.
- A weaver cannot import shell internals, so copies inside testbed weavers are left alone.
- The command-line route already imports the dev kit; the dev kit cannot import the shell or the
  SDK at runtime.

## Goals / Non-Goals

**Goals:**

- One resolution and one drawing for a menu, wherever it is drawn.
- Every item the proposal lists is pinned by a test that fails before the fix.
- Refactor slices change no behaviour and no public declaration.

**Non-Goals:**

- Generating the contract block of the assistant file from the declarations. Worth weighing, but it
  is a tooling decision of its own, not a defect.
- Wiring the theme, layout, settings store and frame plugin scaffolds into the workspace. That is a
  feature for the routes that can reach a workspace and gets its own change.
- A type-check of every generator feature combination. Slice 3 adds compile checks only for the
  escaping cases; a full matrix is a separate investment.
- Replacing the demo's header buttons with surface actions. That is a design call for the demo, and
  waits until the toolbar is released.

## Decisions

**The frame opens an entry, it does not name a slot.** The host already holds the resolved entries
of every subscription. Opening is a new host method taking the subscription and the entry key; the
host derives the menu identity, the description and the heading exactly as the in-page toolbar host
does when an entry is activated, and answers under a new subscription. Activating an entry of that
menu, or its heading key, runs it as the page's menu service runs it.
*Alternative rejected:* letting the frame pass the parent's identity in the description it supplies.
It would work, but the frame could then ask any slot under any identity, and the page's rules
(untitled entries, the heading, the heading's command) would still be re-implemented on the host side
for the frame alone.

**The menu service exposes its resolution.** The private resolve-and-filter the menu service uses
becomes one public method returning the labelled entries and the heading command. The frame bridge
calls it. The slot resolution service cannot host it, because it already depends on the menu service.

**The frame draws with the page's menu drawing.** The drawing module is plain DOM and already
frame-bundlable. The host sends rows already worded, so the frame passes an identity translation.
The heading's "leads to" needs only a label; its parameter narrows from a whole command to the part
it reads.

**Disabled menu entries.** The menu row gains a disabled flag; the drawing sets the element's
disabled attribute, which the menu element already honours for keyboard and pointer, and the menu
service refuses to run a disabled entry as a second line of defence.

**Access across the seam.** A menu entry's access requirement is copied field by field as data:
booleans, role lists of strings, the mode. Anything else is refused with a message naming the plugin.
*Alternative rejected:* refusing access on menu entries, as surfaces do. A surface gates itself
from pushed session state; a menu entry is drawn by the host, which is the only place that can gate
it.

**One state bridge.** The plugin state bridge used by surfaces becomes the only implementation; the
frame session composes it with its own push and keeps only its lifecycle. Key validation moves into
the bridge, so both callers share it.

**Tooling escapes at the boundary of each language.** TypeScript string literals are emitted through
one helper, HTML text and attributes through another, and Angular template text additionally escapes
braces and the at sign. Each recipe uses the helper for every consumer-supplied value.

**`init` pins to itself.** The package list and versions come from the scaffolds' own package
amendments, which already carry the platform version; `init` stops keeping a second list.

**The default shortcut.** A generated weaver claims `mod+alt+<letter>`; browsers reserve no such
chord for themselves. The examples in the guides follow.

**Shared helpers land beside their first owner.** Roving key handling and the fold tray in the
elements layer, menu-description coercion in the menu layer, stored-value parsing beside the
persisted values, the context-menu registration helper in the menu layer, surface placement
assertions in surface normalisation, and the amendment planners in the dev kit.

## Risks / Trade-offs

- [The frame kit's declaration changes shape between commits on main] → Nothing published carries
  it yet; the guide and the assistant file change in the same slice.
- [Refactor slices touch many readers] → Each slice runs the full shell suite, the end-to-end suite
  and every guard, and is reviewed as a pure move.
- [The shortcut default changes for consumers regenerating a weaver] → Only new output changes;
  existing projects keep what they generated.
