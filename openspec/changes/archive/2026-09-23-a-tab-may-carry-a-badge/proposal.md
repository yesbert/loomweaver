> **Status:** approved.

## Why

A product cannot mark a tab. A part that only some people see, a feature in beta, a document that is
a draft: the tab says nothing about it, because a tab carries a title and an icon and nothing else,
and the strip that draws it belongs to the workbench, so a product cannot draw into it either. NextPA
raised it as finding F-039 for the assistant's "Erweitert" part, which V1 marked "Developer"; it now
puts that badge on every card inside the part instead. The owner decided on 2026-09-23 that marking a
tab is a general capability of the workbench, not a request of one product, and that it comes apart
from leaving a tab out, which is a change of its own.

## What Changes

- **A tab may carry a badge beside its title**: a short text, an icon, or both, in one of the tones
  the workbench's badge already has. It is part of the tab's accessible name ("Erweitert,
  Developer"), and it is not a control of its own.
- **A surface may declare a badge** beside its title and icon, and it is drawn on every tab that shows
  that surface: in the content area, in a container's inner panes, and as a view tab in a pane.
- **A plugin may change a surface's badge while the surface is mounted**, the way it can rename the
  surface today, without the surface being rebuilt. This crosses to a sandboxed plugin as renaming
  does.
- **A content tab may carry a badge of its own**, given when it is opened and refined by opening it
  again, as its title is. It is kept with the tab across a restart, like the title it was opened with,
  and wins over the surface's badge.
- **A strip that shows icons only** (the sidebar switcher, panel panes) puts the badge in the tab's
  tooltip and accessible name; there is no room beside an icon for text.

New: a badge field on a surface declaration and on the input that opens a content tab, the badge's
type, and `ctx.updateSurfaceBadge(surfaceId, badge)`. Nothing existing changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surfaces`: *The declaration carries the labels the workbench draws* includes a badge; a new
  requirement, *A surface's badge may be changed while it is mounted*.
- `content-tabs`: *A tab carries its own label, and keeps it* includes a badge a tab was opened with;
  a new requirement, *A tab may carry a badge beside its title*, for how it is drawn and announced.

## Impact

- `platform/libs/core/plugin-sdk`: the badge type, the surface declaration, the input that opens a
  content tab, and `PluginContext.updateSurfaceBadge`.
- `platform/libs/core/shell`: the contribution registry and the plugin context, the sandbox RPC and
  its sanitising, the tab projection (`OpenTab`, `PaneTab`, `StripTab`) and storage of a tab's own
  label, and the pane tab strip's template and accessible name.
- `llms-full.txt`, the weaver guides that document a surface's title and icon and `openContentTab`.
- NextPA finding **F-039**, first half. NextPA can drop the badge on every card of the "Erweitert"
  part and mark its tab instead.
