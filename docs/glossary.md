# Glossary

The words these pages use, one line each. Where two words name the same thing, the entry says so.

## The platform and its parts

- **Platform**: LoomWeaver itself, the code in the published packages. It contains no domain logic.
- **Shell**: the same thing, by the name of its package (`@loomweaver/shell`): the chrome, the region
  engine, the plugin loader and the host services.
- **Host**: the same thing, seen from a plugin: the side of the `ctx` contract that grants, brokers
  and renders.
- **Workbench**: the same thing, seen by the user: the panes, tabs, rails, bars and palette on screen.
- **Region**: one area of the frame a distribution declares: a **bar** (top or bottom), a **rail**
  (the icon strip beside a sidebar), a **panel** (a sidebar) or the **content** area. Each has a
  **dock**: top, bottom, left, right or center.
- **Sidebar**: one side of the workbench: its panel, its rail if it has one, and the header above
  them. The layout declares the parts; the guides say sidebar for the whole.
- **Content area**: the center region. It is URL-addressed: what it shows is what the address bar
  says.
- **Pane**: one tab group. The content area is a tree of panes the user splits; a sidebar is a pane
  too, so work can move between them.
- **Chrome**: everything the workbench draws that is not a plugin's own surface.

## What runs on it

- **Weaver**: a LoomWeaver plugin. It declares a manifest and an `activate(ctx)` and contributes
  surfaces, commands, items and settings through `ctx`. All domain UI and logic lives in weavers,
  including the product's own.
- **Plugin**: the same thing, in general words. "Weaver" is the name for a plugin built for LoomWeaver.
- **Distribution**: a product: a thin application that composes the shell with weavers, declares a
  layout, grants capabilities and brands itself. Mostly one file, the **composition root**
  (`app.config.ts`).
- **Product**: what a distribution ships. The two words are used for the same thing; "distribution"
  is the precise one.
- **Testbed**: the in-repository distribution that exercises every contract. The **demo** is a
  separate product built from the published packages.

## The contract

- **`ctx`**: the one uniform context a plugin receives on activation. Everything a plugin may do
  with the workbench goes through it.
- **Contribution**: something a plugin registers through `ctx`: a surface, a command, a menu item, a
  bar or rail item, a settings section. A distribution can remove one by naming it (`omit`).
- **Surface**: the one author contract for anything the workbench shows. A surface declares what it
  can do (routable, docks, instanceable), and the host places it.
- **View**: the older word for a surface docked in a sidebar. It survives in a few names
  (`provideViews`, `VIEW_STATE`); a view is a surface.
- **Routable surface**: a surface with an address; visiting the address opens it as a tab in the
  content area.
- **Container**: a surface that holds an arrangement of child surfaces, a workspace in a tab.
- **Command**: one action with many triggers: a button, a shortcut, a palette entry, a menu entry,
  an agent tool or a call from a distribution's own code.
- **Capability**: something a plugin declares it needs and the distribution grants. Default-deny: a
  declaration alone grants nothing.
- **Rung**: one of three levels of trust a plugin can run at: trusted and in-process, sandboxed in
  an iframe, or installed at runtime. Four ways in (trusted, frame plugin, operator-deployed,
  community-installed) map onto those three rungs; the last two are both the third.
- **Switch**: one entry of `ShellFeatures`, set with `provideShellFeatures` and changed at runtime
  with `FeatureSwitches`. A switch removes the user's control for a gesture, never the capability.
- **Handle**: an opaque name for a pane the workbench hands out, stable while the pane exists.

## How the workbench behaves

- **Workspace**: a named arrangement of panes, tabs and sidebar views that remembers itself. Exactly
  one is active. A distribution can declare workspaces; the user can save their own.
- **Baseline**: what a workspace returns to when it is reset.
- **Retention**: whether a hidden surface stays alive. A clean hidden surface is destroyed; unsaved
  work keeps it alive; a surface may ask to be kept regardless.
- **Unsaved-work question**: the Save, Discard or Cancel dialog the workbench asks wherever an action
  would destroy work. It is asked by the action, so a distribution's call asks it too.
- **Address pane** (also **URL pane**, **primary pane**): the one pane whose content the address bar
  reflects. Focusing another pane moves the address; it never rebuilds the pane.
- **Pop-out**: a surface shown in a browser window of its own, a viewer onto the same state.
- **Port**: a frontend seam the product implements against its own backend: the settings store, the
  working-state store, the auth source. The platform ships no server.
- **Access**: the requirement a contribution declares about the signed-in user; the shell hides,
  disables or blocks it accordingly. Presentation, not security.

## Tooling

- **Scaffold**: what `@loomweaver/cli`, `@loomweaver/devkit` and `@loomweaver/mcp` generate; three
  doors to the same generators.
- **Composition report**: `loomweaver.report()` in the console of a development build: what this
  product composed and what lands nowhere.
- **`llms.txt`** and **`llms-full.txt`**: the curated map and the single-fetch brief for AI
  assistants.
