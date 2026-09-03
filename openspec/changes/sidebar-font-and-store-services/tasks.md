## 1. The sidebar facade

- [x] 1.1 Add `SidebarService` in `regions/panel/sidebar.service.ts`: declared panel regions from the
      layout token; `regions()` as `SidebarFacts[]` (`regionId`, `collapsed`, `width`);
      `hiddenViews`; `isCollapsed(regionId)`, `width(regionId)`; `collapse`, `expand`, `toggle`,
      `setWidth` (clamp via `PanelSizeService.setWidth`, then `commit`), `hideView`, `showView`;
      unknown region ids are no-ops.
- [x] 1.2 Spec: facts reflect collapse and width changes made through `PanelState`/`PanelSizeService`
      and through the facade; a `computed` on `isCollapsed` re-evaluates; `setWidth` outside the
      range is clamped and persisted; an unknown region changes nothing; `hideView` goes through
      the guard (capturing `SurfaceCloseGuard`) and `hiddenViews` follows; `showView` brings the
      view back.
- [x] 1.3 Spec (rule): with `sidebar.collapse` and `sidebar.hideViews` switched off through
      `FeatureSwitches`, `collapse` and `hideView` still work.

## 2. Publish text size and store

- [x] 2.1 Export `SidebarService` and `SidebarFacts`, `FontScaleService` and `FontScale`, and
      `PluginStoreService` from `@loomweaver/shell`.
- [x] 2.2 Spec: `PluginStoreService.open()` opens the dialog without a catalogue composed (no
      catalogue provider) and with the built-in entries omitted; `FontScaleService.setScale` from
      code persists and the `scale` signal follows.

## 3. Contract and documentation

- [x] 3.1 `docs/reference/host-services.md`: sections *Sidebars*, *Text size* and *Plugin store*, in
      the style of the neighbouring sections; add `shell-layout` and `plugin-store` to the
      `derived-from-specs` line.
- [x] 3.2 `docs/building-a-distribution.md`: point at the reference where sidebars, text size and the
      store's entry points are described.
- [x] 3.3 Package the shell and run `check-api-docs.mjs`: every new export documented.

## 4. Verify and hand over

- [x] 4.1 `npx nx run-many -t test lint -p shell` green; `npm run structure-check` and
      `check-import-cycles.mjs` match their baselines; the testbed production build passes.
- [x] 4.2 `openspec validate sidebar-font-and-store-services --strict` passes.
