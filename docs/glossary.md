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
  **dock**: `top`, `bottom`, `left`, `right` or `center`.
- **Region id**: the name a distribution gives a region, and the name a weaver targets. The scaffold
  declares six: `top-bar`, `primary` (the left rail), `left-panel`, `right-panel`, `main` (the content
  area) and `status-bar`. The guides use those; a distribution may choose its own. The table is in
  [Shell anatomy](reference/shell-anatomy.md#the-region-ids-the-scaffold-declares).
- **Rail**: the icon strip beside a panel. It holds command triggers and workspace entries and is
  curated by the user. The workbench labels it _Activity bar_ in its own menus; the pages say rail.
- **Sidebar**: one side of the workbench: its panel, its rail if it has one, and the header above
  them. The layout declares the parts; the guides say sidebar for the whole.
- **Content area**: the centre region. It is URL-addressed: what it shows is what the address bar
  says.
- **Tab strip**: the row of tabs above a pane. A pop-out has none.
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
- **View**: a surface docked in a sidebar. The API keeps the word (`provideViews`, `VIEW_STATE`), so
  the pages use it too when the dock is what matters; a view is a surface.
- **Chromeless**: a routable surface that fills the content area with no tab strip, for a full-area
  screen. Declared with `chromeless: true`.
- **Sub-route**: an address below a surface's tab root, declared with `subRoutes` or handed over
  wholesale with `rest`. It shows in the address bar and in browser history.
- **Routable surface**: a surface with an address; visiting the address opens it as a tab in the
  content area.
- **Container**: a surface that holds an arrangement of child surfaces, a workspace in a tab.
- **Following tab**: a tab that tracks the current selection. A surface declares `follows`, and the
  workbench keeps one tab pointing at whatever the address selects.
- **Palette**: the command palette, opened with `mod+k`. It lists every command the user may run and,
  in quick-open mode, every address the user may visit.
- **Command**: one action with many triggers: a button, a shortcut, a palette entry, a menu entry,
  an agent tool or a call from a distribution's own code.
- **Capability**: something a plugin declares it needs and the distribution grants. Default-deny: a
  declaration alone grants nothing.
- **Rung**: one of three levels of trust a plugin can run at: trusted and in-process, sandboxed in
  an iframe, or installed at runtime. Four ways in (trusted, frame plugin, operator-deployed,
  community-installed) map onto those three rungs; the last two are both the third.
- **Frame plugin**: a plugin the distribution loads at build time with `provideFramePlugins` into an
  isolated `<iframe sandbox>`; it receives `ctx` over RPC through the same default-deny broker. The
  second rung.
- **Switch**: one entry of `ShellFeatures`, set with `provideShellFeatures` and changed at runtime
  with `FeatureSwitches`. A switch removes the user's control for a gesture, never the capability.
- **Handle**: an opaque name for a pane the workbench hands out, stable while the pane exists.

## How the workbench behaves

- **Workspace**: a named arrangement of panes, tabs and sidebar views that remembers itself. Exactly
  one is active. A distribution can declare workspaces; the user can save their own.
- **Baseline**: what a workspace returns to when it is reset.
- **Retention**: whether a hidden surface stays alive. A clean hidden surface is destroyed; unsaved
  work keeps it alive; a surface may ask to be kept regardless.
- **Dirty**: holding unsaved work. A surface says so by implementing `DirtySurface`; the workbench
  asks the unsaved-work question before it destroys a dirty surface.
- **Unsaved-work question**: the Save, Discard or Cancel dialog the workbench asks wherever an action
  would destroy work. It is asked by the action, so a distribution's call asks it too.
- **Address pane**: the one pane whose content the address bar reflects. Focusing another pane moves
  the address; it never rebuilds the pane. Older text said URL pane or primary pane; the pages say
  address pane.
- **Pop-out**: a surface shown in a browser window of its own, a viewer onto the same state.
- **Port**: a frontend seam the product implements against its own backend. There are three: the
  settings store, the working-state store and the auth source. The platform ships no server.
- **Translation loader**: the fourth seam a product fills, a provider rather than a port: where the
  workbench and the weavers fetch their strings from.
- **Session snapshot**: what the auth source hands the workbench: who is signed in, with which
  roles and claims, as one value that replaces the last. The platform owns no sign-in; it reacts.
- **Tenant**: the customer a product's backend keeps apart from every other. The platform has no
  notion of it; a tenant is a fact of the product's own backend, keyed off the session.
- **Access**: the requirement a contribution declares about the signed-in user; the shell hides,
  disables or blocks it accordingly. Presentation, not security.

## Tooling

- **Scaffold**: what `@loomweaver/cli`, `@loomweaver/devkit` and `@loomweaver/mcp` generate; three
  doors to the same generators.
- **Composition report**: `loomweaver.report()` in the console of a development build: what this
  product composed and what lands nowhere.
- **`llms.txt`** and **`llms-full.txt`**: the curated map and the single-fetch brief for AI
  assistants.
