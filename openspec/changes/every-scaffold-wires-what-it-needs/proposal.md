> **Status:** proposed — not approved for implementation yet.

## Why

Four of the seven scaffolds stop at writing files. The theme, the layout, the settings store and the
frame plugin each leave their wiring to a comment or a README: the theme is never imported, so it
changes nothing; the layout and the settings store are never provided; and the frame plugin is
neither served nor registered nor granted. The scaffolding specification already rules this out: a
route that can reach the workspace performs the wiring rather than naming it, and a route that
cannot names every step that remains, with what skipping it costs. Today the command-line and Nx
routes do neither for these four, and the assistant route answers that the theme "needs nothing",
which is false.

## What Changes

- Each of the four scaffolds states what it needs from the workspace as amendments, the way the
  weaver, distribution and auth-source scaffolds already do, so every route applies or names them
  from one statement.
- **Theme:** the generated stylesheet is imported into the application's entry stylesheet after the
  shell's styles, so it takes effect in its tenant layer.
- **Settings store:** the store is provided in the composition root, unless the composition already
  provides one, in which case that is kept and the replacement is named.
- **Layout:** the layout is provided in the composition root where none is; where the composition
  already provides a layout, that is kept and the swap is named, because replacing a consumer's
  layout without being asked is worse than asking.
- **Frame plugin:** its files are served through the build target, and it is registered and granted
  the capabilities it declares in the composition root.
- The assistant route names each of these steps, with what skipping it costs, instead of nothing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a defect against the scaffolding requirements that already exist — "A route that
cannot finish the wiring says what is left" (a route with workspace access performs the wiring;
one without names it) and "A generator composes into what is already there" (what a project
declared for itself is kept) — so the change sets `skip_specs` and pins the behaviour with tests.

## Impact

- Dev kit: the theme, layout, settings-store and frame-plugin recipes gain amendments; the
  amendment vocabulary gains the two kinds these need (an entry-stylesheet import, and a provider
  line that is named rather than added when its kind is already provided).
- Command-line and Nx routes: apply the new kinds; the assistant route describes them.
- Guides: `docs/scaffolding.md` and the four scaffolds' notes stop telling the reader to wire by
  hand what is now wired.
