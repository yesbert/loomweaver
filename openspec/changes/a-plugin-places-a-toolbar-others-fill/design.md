## Context

See proposal.md, *Why*. What the code looks like today, as far as it shapes the approach:

- `menu-resolution.ts` is the one complete pipeline: it matches `when` against the context, drops
  an entry whose command is unregistered, takes title and icon from the command, adds the shortcut
  and sorts by group and order. `MenuService` then asks `CommandService.available` per entry and
  drops the refused ones. The palette repeats the available-check and the label/icon/shortcut
  mapping in `command-rows.ts` without `when`.
- The rail, the bar and the surface actions each read a different registry signal (`railItems`,
  `barItems`, `actionsOf(surfaceId)`), each filter with `auth.visible(item.access)` and
  `offers.offered(...)`, each sort by `order`, each draw the picture → initials → icon ladder, the
  translated title, the tooltip and the `run()` choreography. None asks `commands.available` for
  the named command except the surface actions in a pop-out.
- `ChromeItemOffers` and `MenuTriggerDirective` are already shared by the three docks; they decide
  whether a control that opens a menu on activation is drawn and wire the gesture.
- Menu slots are free strings. The testbed owns `testbed.account/menu`, `testbed.rail/context`
  and `testbed/search/more` by naming them on controls. Nothing records who declared a slot.
- `composition-checks.ts` is where development-time mistakes are collected and reported, after the
  plugins have activated.
- The bar already has the two item forms the toolbar needs: `BarButtonItem` (declarative) and
  `BarComponentItem` (an Angular class rendered into the cell, told its bar through `BAR_CONTEXT`,
  hidden-only on access, folded whole by `bar-fold.ts`).
- The frame RPC carries `registerMenuItem`, `invokeCommand` and `invocableCommands`. It carries no
  `registerCommand`, no bar or rail items, and `sanitizeRpcSurface` drops `actions`. The frame
  receives `lw-menu`, `lw-button`, `lw-icon` and `lw-tooltip` from frame-kit with no connection to
  the registry.
- The scenario the design is checked against: TreeWeaver published to npm and composed into
  NextPA. Both are in-page plugins in one Angular; NextPA's own plugin registers entries, buttons
  and component cells into TreeWeaver's slots.

What is listed above was read from the source for this proposal, not from memory. The first task
of the change is a line-by-line inventory of the same places, because the aim of slice 1 is to
remove duplication rather than to add a sixth place where an item is filtered; anything that
inventory finds shared and not covered here is added to the plan.

## Goals / Non-Goals

**Goals:**

- One function answers "what does slot X offer, to this session, against description Y", and
  every dock reads it. The access defect disappears as a consequence, not as a patch.
- A toolbar is a renderer of that answer, placed by the plugin, not by the distribution.
- Nothing new to learn for the plugin filling a toolbar: it is `registerMenuItem`.
- Slice 1 ships without a new place to put anything, so its only visible change is the fix.

**Non-Goals:**

- Merging the rendering of rail, bar and surface actions into one component. They differ in anchor
  bands, curation, name-display, bar slots, `component` cells and pressed state for reasons the
  specs state; one component for all would be abstraction over the need.
- Giving the rail or the bar `when` matching, or a title/icon fallback from the command. Not asked
  for; a rail entry declaring its own title and icon stays as it is.
- A toolbar the distribution places in the frame. The bar is that already.
- Component cells across the frame boundary. Stated as a limit.
- A slot registry with namespacing or ownership checks for *menu* slots. Only a toolbar has an
  owner, because two toolbars on one slot would draw the same entries twice beside each other.

## Decisions

**A toolbar is a rendered menu slot, and its entries are `MenuItem`s.** The precedent is the
reference workbench's editor title: a menu id drawn as a toolbar, the `navigation` group inline and
the rest behind an overflow. Choosing this over a new `ToolbarItem` type means a plugin that knows
menus knows toolbars, `when`, `checkedWhen`, groups and the command-derived label all come for
free, and the same entry can be offered in a context menu and a toolbar by naming two slots.
Rejected: a `ToolbarItem` mirroring `BarButtonItem`. It would be the fifth item type with the
fourth copy of the resolution.

**Resolution is one pure function, the docks are its readers.** `resolveMenuItems` grows into
`resolveSlot(slotIds, context, sources)` and takes over what `MenuService` does afterwards: the
`available` check and the pop-out rule. Its result gains `pressed` (from `checkedWhen`), `opensMenu`
(from `menu` + `menuTrigger`) and the plugin that contributed the entry. Rail, bar, surface actions
and palette keep their own templates but stop filtering: each maps its items into the shape the
function reads, or — for the surface actions — becomes a toolbar outright. The rail and the bar
keep item-level `access` as an additional filter, applied before the function, because the spec
says the control's own requirement still counts. Rejected: a service with signals per dock. The
docks already hold the signals; a pure function is testable without a `TestBed` and is the part
that was duplicated.

**Declared means: named by a control, registered as a toolbar, or the workbench's own.** No new
"declare slot" call. The set of declared slots is computed from what exists: the `menu` field of
every registered rail item, bar button and surface action, the slot of every registered toolbar,
and the workbench's own built-in slot list. A surface's registration declares `<surface-id>/actions`
implicitly. Rejected: an explicit `declareMenuSlot(id)`. It would make the testbed's three existing
slots invalid until declared and adds a call nobody needs, since a slot that no control opens
cannot be seen anyway.

**Reporting after composition, through the existing diagnostics.** `composition-checks.ts` gains
`undeclaredSlots(menuItems, declaredSlots)` and the report lists them with the entry, the slot and
the contributing plugin. The development warning that today fires when activation completes runs
the same check. A plugin installed from the store later re-runs it. Rejected: warning at
`registerMenuItem`. NextPA activates in whatever order the composition lists, and a warning for an
entry whose owner activates one tick later is noise that trains people to ignore the channel.

**One toolbar owner per slot, enforced at registration.** `registerToolbar({ slot, ... })` records
the owner; a second registration under the same slot from another plugin is refused with both
plugin ids. Same plugin re-registering replaces, as every contribution does. A toolbar is a
contribution and dies with its plugin.

**The element is `<lw-toolbar>`, placed by the plugin, bound to the slot and a context.** It is a
custom element in `shell/elements/toolbar/`, registered with the others so it reaches frames through
frame-kit. In the page it takes `slot` and `context` as attribute or property like every element and
reads the resolution through a small bridge the shell installs when it boots (the same way
`lw-menu` gets its words). It draws `lw-button`s with `lw-icon` and `lw-tooltip`, `aria-pressed`
for a state, a roving tabindex over its entries with the existing `roving-focus.ts`, and `role=
"toolbar"` with the plugin's `label`. The fold reuses `bar-fold.ts`'s rank-and-fold logic with a
measured width; the fold control opens the folded entries as an `lw-menu` through `MenuService`.
Rejected: an Angular component only. The UI boundary is Web Components and the frame needs the same
element.

**Component cells: two doors, both in-page, same type.** The owner puts its own controls into the
element as light-DOM children with `slot="cell"` and an `order` attribute; the element places them
among the resolved entries by order. A foreign plugin registers a `ToolbarCell` (`slot`,
`component`, `order?`, `access?`) through `ctx.registerToolbarCell`, mirroring `BarComponentItem`;
the element renders it through the same bridge, which hands it `TOOLBAR_CONTEXT` with the slot and
the placement's description. A cell is folded whole, like a bar's component item. Rejected: a cell
as a nested iframe for frame plugins. A surface in a toolbar, with a connection per cell, for a
need nobody has stated; the reference workbenches do not allow it either.

**Surface actions become `<lw-toolbar slot="<surface-id>/actions">`.** The surface's declared
`actions` are mapped to `MenuItem`s on that slot by the registry when the surface is registered,
with `checkedWhen` derived from the toggle state and `when` matching the surface id, so
`updateSurfaceAction` keeps working as a replacement of one mapped entry. The four hosts that
embed `lw-surface-actions` embed the toolbar with a context naming the surface and the region. The
`ViewAction` type stays published and unchanged. The owner decided that a foreign plugin may add
to a surface's header, as the reference workbench allows on `view/title`; the surface's own actions
are told apart by the contributing plugin, and a distribution removes a foreign one by its id.

**The toolbar is named by its plugin, at registration and per placement.** `registerToolbar` takes
a `title` (a translation key or a literal, like every chrome text), and the element takes a `label`
attribute that overrides it for one placement; the element puts the worded result on `aria-label`
and follows the strings as `lw-menu` does. Rejected: deriving the name from the placement's
description. A description is a set of named values for matching, not a sentence, and the workbench
cannot know what the row of controls is for.

**Frame RPC: `watchSlot` / `unwatchSlot`, data only.** The surface channel gains
`watchSlot(slot, context)` returning a subscription id, with the host pushing
`slotChanged(subscriptionId, entries)` whenever the resolution's inputs change, and `unwatchSlot`.
The context is validated with the existing wire-field helpers. Entries are the resolved shape minus
anything that is code: `id`, `title`, `icon`, `shortcut`, `group`, `order`, `pressed`, `opensMenu`,
`commandId`. Inside the frame, `<lw-toolbar>` is the same element with a different bridge: frame-kit
installs one that calls `watchSlot` and invokes through the existing `invokeCommand`. The host
narrows the answer by the same `available` rule plus the foreign-command rule for the frame's
plugin, so the answer is a subset of `invocableCommands` where entries name foreign commands.
Rejected: shipping the resolution into the frame. It would need the registry, the session and the
translations in the frame, which is what the boundary exists to keep out.

**Translation in the toolbar.** The resolved title is a key or a literal; in the page the element
translates through the bridge as `lw-menu` does today and follows the strings. In the frame the
host sends worded titles and re-sends on a language change, because the frame has no bundles.

## Risks / Trade-offs

- [Slice 1 hides controls products relied on seeing] → the spec already promised this for menus and
  the search; the release notes name it as the breaking change, and the testbed gets a fixture
  that shows a rail entry appearing with the session.
- [Mapping `ViewAction` to `MenuItem` loses a field] → `ViewAction` has `id`, `icon`, `title`,
  `order`, `menu`, `menuTrigger`, `menuHeader`, `command`/`run`, `access`, `pressed`. `MenuItem`
  has no `icon`, `access`, `menuTrigger`, `menuHeader` or `pressed`. The mapped entry carries them
  as the resolution's extra fields; `MenuItem` grows `icon?`, `access?` and the menu-opening trio
  so a toolbar entry can declare them too, which is what a toolbar button needs anyway.
- [Width measurement for folding in a custom element] → a `ResizeObserver` on the host and the
  same rank-and-fold used by the bar; an element in a `display: none` ancestor measures zero and
  folds everything, so folding is suspended while the width is zero.
- [A frame subscribes and never unsubscribes] → the subscription is tied to the surface's channel
  and dropped with it, the same lifecycle `stateWatch` has today.
- [The undeclared-slot report fires for a slot that a sandboxed plugin's control would declare]
  → a sandboxed plugin cannot register controls, so it cannot declare a slot except through its
  surface's `/actions` slot, which the surface registration declares. Nothing to report wrongly.
- [Two plugins each place a toolbar for the same slot in their own content] → only one may
  *register* it; the other may still *place* the element for a slot it does not own, which is
  allowed and useful (NextPA drawing TreeWeaver's toolbar beside its own view of the data).
  Ownership is about declaration, not about placement.

## Migration Plan

Slice by slice, each a pull request on green CI; no step requires the next.

1. Slice 1 is a minor release: the hidden-control change is breaking for products that noticed
   the drawn-but-refused control. Rollback is the previous version; nothing is stored.
2. Slice 2 adds published types (`registerToolbar`, `registerToolbarCell`, `ToolbarCell`, the
   `MenuItem` additions) and the element. Additive. `lw-surface-actions` is removed from the shell
   once the toolbar replaces it in all four hosts; it was never published.
3. Slice 3 adds two RPC methods and one remote callback, and the frame-kit bridge. Additive; a
   frame built against the previous frame-kit does not call them.

## Open Questions

- Whether the fold control's menu should carry a heading naming the toolbar's label. Cosmetic;
  decided when the element is in front of us.
- Whether the demo distribution shows a placed toolbar in its own right or only through the surface
  header. Decided when slice 2 lands, in the demo's own change.
