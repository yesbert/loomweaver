> **Status:** approved.

## Why

The workbench draws no scrollbar of its own. There is not one line about scrollbars in its
stylesheet, so what a user sees is whatever the browser paints, in the operating system's grey.

That fails a guarantee the platform already gives. The `theming` capability requires that the
workbench draw its chrome exclusively from a fixed, named set of design tokens, and that redefining
a token re-colours everything drawn from it. A scrollbar in system grey is drawn from nothing we
name: a product that re-colours the whole workbench cannot touch it, and it does not follow the dark
theme either, beyond whatever the browser infers.

It shows worst where the workbench is narrowest. The rail is forty pixels wide unlabelled, and the
system's scroll indicator lands on top of the icons, wide and dark against a thin column. The rail
only began to scroll with the change *rail-labels-and-overflow*, which is what made this visible,
but the missing guarantee is older than that and is not limited to the rail: every sidebar, every
pane and every dialog that scrolls has the same untokenised bar.

## What Changes

- The workbench names a scroll indicator's thumb and its track, so both are part of the token set a
  product redefines, in light and in dark.
- Everywhere the workbench scrolls it draws a thin indicator from those tokens, rather than the
  operating system's default. Thin rather than absent: an indicator that is not there is not an
  improvement, it is a hidden affordance.
- The consumer documentation of the tokens gains the two new names, because a published name that
  is not documented is not published.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The requirement *Everything visible is expressed in named tokens* under `theming` already says
what has to be true; the implementation does not do it for scroll indicators. Restating it as a new
requirement would add a second place to keep true, so this change names the requirement it fails and
brings a test that pins it.

## Impact

- `platform/libs/core/shell/src/lib/styles/theme.css` holds the whole token set and both themes, and
  has no scrollbar rule of any kind. Both the two new tokens and the single rule that uses them
  belong there.
- `docs/reference/design-tokens.md` is the cheat sheet a template author reads before writing one,
  and lists the tokens by name.
- Every scrolling surface of the workbench is affected at once, by design: the rail's band, the
  sidebars, the panes, the dialogs, the settings surface.
- A plugin rendered in an isolated document does not inherit the rule, because it is a document of
  its own. That is the existing boundary and this change does not move it.

No legacy source is dissolved by this change.
