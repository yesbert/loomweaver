## Context

See proposal.md, *Why*. What shapes the approach:

- The sidebar behaviour is already in services with the right granularity: `PanelState` (collapse,
  expand, toggle per region, persisted, evacuating retained surfaces on collapse), `PanelSizeService`
  (width per region, clamped on `setWidth`, persisted on `commit`/`endResize`), `ViewVisibilityService`
  (`hide` with the unsaved-work guard, `reveal`, `toggle`) and `HiddenViewsService` (the `hidden` set
  as a signal). The header, the splitter and the view menu call them directly; nothing lives in a
  trigger.
- The ids are the distribution's own: panel regions come from `provideLayout`, view ids from the
  views it or its plugins registered. No handle is needed.
- `FontScaleService` has `scale` as a signal and `setScale`; the toggle in the settings calls it.
- `PluginStoreService.open()` opens the dialog; the dialog tolerates a missing catalogue (it injects
  it optionally and loads no entries). `configure(title)` is called by `providePluginCatalog`.

## Goals / Non-Goals

**Goals:**

- One published `SidebarService` that is a facade over the four sidebar internals, with the
  distribution's vocabulary and facts as signals, and no behaviour of its own.
- `FontScaleService` and `PluginStoreService` published as they are.
- Every added name documented in the host-services reference.

**Non-Goals:**

- No change to any internal service, any control, any switch or any persistence key.
- Moving views between sidebars, stacking, reordering, named view instances: not reached here, as
  the exploration decided.
- No handles: the ids the distribution declared are the arguments.

## Decisions

**A facade, because four internals share one face.** `SidebarService` in `regions/panel/` translates
and delegates: `collapse`, `expand`, `toggle` to `PanelState`; `setWidth` to `PanelSizeService.setWidth`
followed by `commit`, so a width set from code is remembered like a released drag; `hideView` to
`ViewVisibilityService.hide` (guarded), `showView(viewId, regionId?)` to `reveal`. It holds no
behaviour. The alternative, exporting the four services, would publish `beginResize`/`endResize`,
`openOverlay`/`closeOverlay` and the raw hidden-view set, which are the controls' mechanics rather
than a distribution's vocabulary.

**Regions are validated against the layout.** The facade reads the declared panel regions from the
layout token and treats an unknown region id as a no-op, so a typo cannot create phantom state in the
persisted collapse or width maps.

**Facts.** `regions(): Signal<readonly SidebarFacts[]>` with `{ regionId, collapsed, width }` per
declared panel, `hiddenViews: Signal<readonly string[]>` from `HiddenViewsService.hidden`, and the
per-region reads `isCollapsed(regionId)` and `width(regionId)` for convenience; both read signals, so
they are reactive where they are called.

**Text size and store are exported as they are.** Their surfaces already match the rules: a signal
to read, a method to set, no switch consulted. `PluginStoreService.configure` becomes visible with
the class; it is documented as what `providePluginCatalog` uses to brand the title, not something a
distribution needs.

**No switch is read.** The facade does not consult `sidebar.*` switches; the controls do.

## Risks / Trade-offs

- [Two ways to set a width: drag path and facade] → Both end in `PanelSizeService.setWidth` and a
  persist; the facade's `setWidth` is the released-drag pair (`setWidth` + `commit`), so no third
  path exists.
- [`showView` with a region the view was not declared for] → `reveal` already handles that by moving
  the view; the facade passes it through unchanged.
- [`configure` on the store service is now callable by a distribution] → Harmless: it re-titles the
  dialog; the reference says what it is for.
