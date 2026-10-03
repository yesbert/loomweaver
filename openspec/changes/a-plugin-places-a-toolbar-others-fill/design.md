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

### Inventory, 2026-10-03 (task 0)

Read line by line before slice 1. Paths are under `platform/libs/core/shell/src/lib/`.

| Concern | Rail `regions/rail/shell-rail.ts` | Bar `regions/bar/shell-bar.ts` + `shell-bar-item.ts` | Surface actions `regions/content/actions/surface-actions.ts` | Palette `commands/palette/command-palette.ts` + `command-rows.ts` | Menus `menu/menu.service.ts` + `menu-resolution.ts` | Curation `regions/curation/rail-curation.ts` |
|---|---|---|---|---|---|---|
| Place filter | `regionOf(...) === region.id` (219) | `item.bar === region.id` (81) | `actionsOf(surfaceId)` (61) | all commands | `menuIds.includes(item.menu)` (31) | every rail |
| Item's own access, hide | `auth.visible` (220) | `auth.visible` (82) | `auth.visible` (62) | n/a | n/a, an entry has no access | `auth.visible` (37) |
| Item's own access, disable | `auth.disabled` (139) | `auth.disabled` (101) | `auth.disabled` (90) | n/a | n/a | n/a |
| **Command's access** | **not checked** | **not checked** | pop-out only, `belongsInThisWindow` (104–112) | `commands.available` (192) | `usableCommands` → `available` (240–244) | **not checked** |
| Command registered | via `offers.offered` → `triggerable` (221) | `offers.offered` (83) | **only when the action opens a menu** (64–68); a plain action naming an unregistered command is drawn dead | n/a | `resolveItem` drops it (44–48) | `offers.offered` (38) |
| Pop-out rule | not applied | not applied | `belongsInThisWindow` | via `available` | via `available` | not applied |
| `when` against the context | none | none | none | none | `whenMatches` (31) | none |
| Control drawn only while its menu offers something | `offers.menuOnActivation` (148) | (80–85) | (76–78) | n/a | n/a | `offers.offered` (38) |
| Sort | `railEntries` by `order`, then user order | `bySlot` by `order` (180–184) | by `order` (69) | fuzzy rank | group, then order (35) | none |
| Label | `item.title \| transloco` (html 55, 97) | `tooltip ?? label \| transloco` (html 12, 34) | `action.title \| transloco` (html 25, 30) | `translate(command.title)` (29) | `item.title ?? command.title` (50), worded in `drawMenu` | `transloco.translate(item.title)` (47) |
| Icon | `item.icon` (html 90) | `btn.icon` (html 31) | `action.icon` (html 29) | `command.icon` (30) | `command.icon` (59) | `item.icon` (48) |
| Picture → initials → icon | html 73–91, own `brokenPictures` (120, 130–136) | html 14–32, own `brokenPicture` (64, 113–119) | icon only | icon only | heading only, in `menu-drawing.ts` | initials only |
| Tooltip | `lw-tooltip` (html 101) | (html 43) | (html 30) | none | none | none |
| Shortcut | none | `showShortcut` → `commands.shortcutOf` (103–111) | none | `shortcutOf` (31) | `shortcutOf` (60) | none |
| State | `aria-current` for a workspace (html 56) | none | `aria-pressed` from `action.pressed` (html 26) | none | `checkedWhen` → checkbox (56–57) | none |
| `run()` | 179–191: disabled guard, `warnMenuTriggerConflict`, menu-on-activation, workspace switch, `commands.trigger` | 121–128, same without the workspace | 93–102, same | `commands.execute` | `execute` or `item.run` (228–238) | n/a |
| Menu announced | `MenuTriggerDirective` | same | same | n/a | n/a | n/a |

What the table says:

- Two defects, not one. Rail, bar and surface actions ignore the named command's access everywhere
  but the pop-out. And a surface action that names an unregistered command is drawn as a dead
  control unless it also opens a menu, which the `commands` capability forbids.
- The shared helpers already in place, to reuse and not rewrite: `ChromeItemOffers`
  (`menu/chrome-item-offers.ts`) and `chrome-item-menu.ts` for menu-on-activation,
  `MenuTriggerDirective` for the gestures and the announcement, `bar-fold.ts` for folding,
  `elements/roving-focus.ts` for arrow-key focus, `whenMatches` and `resolveMenuItems` for the
  menu pipeline, `CommandService.available/shortcutOf/trigger` as the one seam.
- `ChromeItemOffers.offered` is the dock-side half of the resolution (registered command, or a menu
  that offers something, or a workspace, or a component cell). It dissolves into the one function;
  its `menuOnActivation` becomes that function's hook for menu-opening controls. The service is
  renamed to what it then is, the slot resolution, and the five readers move to it.
- The picture → initials → icon ladder is written twice with two broken-picture signals; the toolbar
  would be the third. It becomes one piece in slice 2, when the third consumer arrives.
- Rail-specific and bar-specific concerns that stay where they are, with their reason in the spec:
  bands and user order, labels on and tooltips off (`shell-layout`), region filtering, folding and
  component cells (`shell-layout`), the workspace switch (`workspaces`).
- Tests that pin today's behaviour: `shell-rail.spec.ts` (567 lines: access 295–320, menu-opening
  items 449–560), `shell-bar.spec.ts` (244: offered items 181–244), `shell-bar-item.spec.ts` (363:
  disable mode 129), `surface-actions.spec.ts` (357: access 168, pop-out 180–230, menu items
  290–357), `command-palette.spec.ts` (514: session 208), `menu-resolution.spec.ts` (100),
  `menu-follows-the-session.spec.ts` (128), `composition-report.spec.ts` (370). Slice 1 keeps all
  of them green except where it changes behaviour on purpose: a control naming an unavailable
  command disappears instead of running into the seam's refusal.
- Menu entries carry no owner today; `addMenuItem` takes none. Reporting the contributing plugin
  needs the owner stamped the way `addCommand` stamps it.
- Nothing marks the end of activation. `PluginRuntime.activateAll` runs the first reconcile
  synchronously and tracks activation promises only to report errors; `FramePluginRuntime` tracks
  connection promises the same way. Both now hand them to `ActivationSettled`, whose `settled()`
  the report awaits.
- A sixth reader the table missed: the settings dialog drops a button row whose command nothing
  registers, through `CommandService.triggerable`, and read nothing about the command's access. It
  reads the resolution now, and `ui-primitives` says so.

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

**Resolution is one pure function, the docks are its readers.** `resolveMenuItems` became
`resolveSlot(entries, contextOf, sources)` in `menu/menu-resolution.ts` and took over what
`MenuService` did afterwards: the `available` check, which carries the pop-out rule. It takes the
entries already narrowed to a slot, a context *per entry* (a rail item is matched against its own
`{ targetKind, id, region }`, a menu's entries all against the one the menu was opened with), and a
`SlotSources` record of predicates, so it stays free of services and `TestBed`. Its result carries
the command it resolved, `disabled` from the entry's own requirement, `opensMenu` from the
menu-on-activation hook, and the typed entry, so a dock's template keeps reading its own item
fields. An entry is dropped when its `when` does not match, when its own requirement hides it, when
it names a command that is unregistered or unavailable, or when it leads nowhere: no command, no
behaviour, no menu that offers something, no workspace. The rail, the bar, the surface actions, the
palette, the settings dialog's button rows and the rail curation all read it through
`SlotResolution` (`menu/slot-resolution.service.ts`), which replaced `ChromeItemOffers`: its
`offered` dissolved into the function and its `menuOnActivation` became the function's hook.
`MenuService` builds the same sources itself, because `SlotResolution` depends on it for the hook
and a cycle was not worth a second service. Rejected: a service with signals per dock. The docks
already hold the signals; a pure function is testable without a `TestBed` and is the part that was
duplicated.

**Declared means: named by a control, registered as a toolbar, or the workbench's own.** No new
"declare slot" call. The set of declared slots is computed from what exists: the `menu` field of
every registered rail item, bar button and surface action, the slot of every registered toolbar,
and the workbench's own built-in slot list. A surface's registration declares `<surface-id>/actions`
implicitly. Rejected: an explicit `declareMenuSlot(id)`. It would make the testbed's three existing
slots invalid until declared and adds a call nobody needs, since a slot that no control opens
cannot be seen anyway.

**Reporting after composition, through the existing diagnostics.** `composition-checks.ts` gained
`undeclaredSlots(entries, declared)` and `diagnostics/declared-slots.ts` computes the declared set
from the workbench's five slot constants, every rail item's and bar button's `menu`, every surface
action's `menu` and, from slice 2, every registered toolbar. The on-demand report lists the
problems with the entry, the slot and the contributing plugin; for the latter the registry now
stamps the owner on a menu entry the way it stamps it on a command (`RegisteredMenuItem`). The
development warning is one shot: `CompositionReport.reportUndeclaredSlotsOnceSettled()` awaits
`ActivationSettled` (`plugin/activation-settled.ts`, into which both runtimes hand every
asynchronous activation and every sandbox connection) and then one quiet second, so that the
registrations a frame makes right after connecting have landed, and warns once. A plugin
installed from the store later is covered by the on-demand report, not by a second warning.
Rejected: warning at `registerMenuItem`. NextPA activates in whatever order the composition lists,
and a warning for an entry whose owner activates one tick later is noise that trains people to
ignore the channel. Also rejected: a reactive effect with a debounce. It would be the more
complete version of the same heuristic, for a channel that is advisory and development-only.

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

**As built in slice 2: the element draws, the host decides.** `<lw-toolbar>`
(`elements/toolbar/lw-toolbar.element.ts`) knows nothing of commands, sessions or words. It takes
`entries` of a plain shape (`LwToolbarEntry`: key, worded label, icon, shortcut, pressed, disabled,
whether it opens a menu, whether it has a context menu, group, order), draws native buttons with
`.lw-icon-btn` and `<lw-tooltip>`, separators between groups, `role="toolbar"` with roving focus,
`hidden` while it has nothing to draw, and reports every activation and right-click as an event
(`lw-toolbar-select`, `lw-toolbar-context`). It folds on its own, into a tray it owns, so folding
works the same inside an isolated surface where no `MenuService` exists; folded cells move into the
tray whole, which is what the spec asks and what a menu could not hold. A rendered button carries
`data-lw-entry="<id>"`; the end-to-end tests select by it, as they selected `data-surface-action`
before. Children the plugin writes are cells, told apart from the element's own nodes by the
absence of those markers; a `MutationObserver` re-renders when such a child arrives or leaves, and
`refresh()` does the same on demand. The element finds its driver through a module-level bridge
(`elements/toolbar/toolbar-bridge.ts`): whoever installs a host is told of every connected
toolbar, including ones connected before the host arrived.

The in-page driver is `ToolbarHost` (`regions/toolbar/toolbar-host.service.ts`), installed when
the shell boots and whenever `SurfaceActions` injects it, so a spec rendering surface actions needs
no extra wiring. Per attached toolbar it runs one effect over `SlotResolution`: the entries of the
slot are the menu entries aimed at it plus, where the slot is a surface's `<id>/actions`, that
surface's declared actions, both adapted to one `ToolbarEntry` shape
(`regions/toolbar/toolbar-entries.ts`); each is resolved against the placement's context plus its
own id, worded, and handed to the element. The first draw happens synchronously on attach and on
every change the element reports, outside the reactive graph, because Angular sets the `context`
property while rendering the plugin's template and a signal write there is an error. Cells are
Angular components created with `TOOLBAR_CONTEXT` provided and appended into the element with their
`order`. Activation runs through `CommandService.trigger(item, context)`, which gained the context
and now also serves `MenuService`, so a menu entry and a toolbar entry run the same way; an entry
whose slot offers something opens that slot beside the button through `MenuService.open`.

Two things moved from the plan. `TOOLBAR_CONTEXT` lives in the SDK, not the shell: a weaver may
import only the contract, and the cell that injects it is a weaver's component. Toolbars have a
registry of their own (`contributions/toolbar-registry.ts`) rather than growing the contribution
registry past its line limit; it is also where the actions slot of a surface is named.

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
