> **Status:** proposed — not approved for implementation yet.

## Why

Three parts of the workbench can still only be driven by the user's hand. The sidebars: collapsing
and expanding a panel, changing its width, hiding a view and bringing it back live in internal
services behind the sidebar header, the splitter and the view menu, with no published way in. The
text size: the switch sits in the settings and nowhere a distribution's own control could reach it.
The plugin store: its dialog opens from a settings row and a palette command, and a distribution
that hides both has no way to offer the store from its own page.

Each of these has the behaviour already in a service that the controls call. What is missing is the
published face and, for the sidebars, a vocabulary the distribution already speaks: the region ids it
declared and the view ids it registered. This is the fourth and smallest slice of the
distribution-facing workbench API: it publishes what exists and adds one thin service where several
internals need a common face.

## What Changes

- **A published sidebar service.** A distribution reads the sidebars as facts (which panel regions
  exist, whether each is collapsed, how wide it is, which views are hidden) and collapses, expands,
  toggles and resizes a panel and hides or shows a view from its own code, by the ids it declared.
  Hiding a view asks about unsaved work exactly as the view menu does. Switched-off sidebar
  capabilities stay reachable through the service, as `host-services` requires.
- **The text size is published.** A distribution reads the current size as a fact and sets it from
  its own control, with the same persistence and the same "default imposes nothing" rule.
- **Opening the plugin store is published.** A distribution opens the store dialog from its own
  control, whether or not it kept the built-in settings row and palette command.
- No behaviour moves: the sidebar header, the splitter, the view menu and the text-size toggle
  already call the services this change publishes or wraps. The change adds no switch, no command
  and no persistence key.

No breaking change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shell-layout`: adds that a sidebar's collapse, width and view visibility are reachable to the
  distribution by the ids it declared, with the same guard for hiding a view, and readable as facts.
- `theming`: adds that the text size is readable and settable by the distribution.
- `plugin-store`: adds that the store can be opened from the distribution's own control, and what
  it shows without a catalogue.

`host-services` is not modified; its requirements cover the services this change publishes, and the
tests this change adds pin them.

## Impact

**Shell.** A new `SidebarService` in `regions/panel/` over `PanelState`, `PanelSizeService`,
`ViewVisibilityService` and `HiddenViewsService`, reading the panel regions from the declared layout.
`FontScaleService` and `PluginStoreService` are exported as they are. Nothing else changes.

**Published contract.** `@loomweaver/shell` exports `SidebarService` with its facts type,
`FontScaleService` with `FontScale`, and `PluginStoreService`. Every added name must appear in the
consumer documentation before `check-api-docs` passes.

**Documentation.** `docs/reference/host-services.md` gains *Sidebars*, *Text size* and *Plugin
store*. `docs/building-a-distribution.md` points at them where it describes the sidebars, the text
size and the store's entry points.

**Specifications.** Deltas on `shell-layout`, `theming` and `plugin-store`.

**Legacy sources dissolved.** None.
