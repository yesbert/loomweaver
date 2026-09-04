# Surfaces in a sidebar

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `surfaces` · `shell-layout` · `ui-primitives`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

A surface docked in a sidebar is the most common thing a weaver contributes. This page declares one, and names the one escape hatch that is not `ctx`.

## Panel surfaces — your UI in a panel

A **non-routable** surface docks an Angular component into a region the distribution declared: its
home dock is `docks[0]`. The host renders a tab per surface in that region, so independent weavers
coexist, and the user can move it elsewhere from there.

```ts
// src/lib/views/notes-list-view.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'notes-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ul class="flex flex-col gap-1 text-sm text-content">…</ul>`,
})
export class NotesListView {}

// in activate(ctx):
ctx.registerSurface({
  id: 'notes.list',
  title: 'notes.list.title',    // a translation key (or a literal)
  icon: 'navigator',            // host icon name
  order: 0,
  docks: ['left-panel'],        // home dock: a PANEL region id (no `routable` ⇒ not URL-addressed)
  actions: [                    // the surface's own header actions (not view switchers)
    { id: 'notes.list.add', icon: 'add', title: 'notes.add', command: 'notes.add' },
  ],
  component: NotesListView,
});
```

Use **semantic design tokens** in templates (`text-content`, `bg-surface`, `text-brand`), never raw
colours — see [design tokens](../reference/design-tokens.md).

## What your view's own body can use

A weaver depends only on `@loomweaver/plugin-sdk`, so inside your component's template you have:
semantic tokens, the `prose-lw` markdown utility, and the host **`<lw-*>` custom elements**. They are
framework-agnostic, so you consume them **by tag**, with no `@loomweaver/shell` import; in an Angular
weaver add `schemas: [CUSTOM_ELEMENTS_SCHEMA]`. Which elements exist and what each takes is the table
in [Host building blocks](../reference/design-tokens.md#host-building-blocks):

```ts
@Component({ /* … */ schemas: [CUSTOM_ELEMENTS_SCHEMA], template: `
  <button class="relative …">
    <lw-icon name="document" size="1rem"></lw-icon> {{ file.name }}
    <lw-tooltip [text]="file.path" position="right"></lw-tooltip>
  </button>` })
```

> **`<lw-*>` elements don't survive `[innerHTML]`.** Angular's `DomSanitizer` strips unknown elements
> from a string you bind with `[innerHTML]`, so an `<lw-tooltip>`/`<lw-icon>` written _inside_ such a
> string is silently removed. Consume the `<lw-*>` elements in your **template** (as above), not inside an
> HTML string. For interactive affordances on `[innerHTML]` content, keep a plain attribute the sanitiser
> preserves (e.g. a native `title` for a basic tooltip) or render that part as a real template element.
> (`<lw-tooltip>` itself is a top-layer popover, so it is **not** clipped inside a scrolling/virtualised
> or `transform`ed ancestor.)

Everything else is a **CSS class contract on a native element**: `.lw-btn` on `<button>`, `.lw-field`
on an input, and so on. A native control already has full semantics, keyboard support and a11y, so it
needs only theming, not a web component. The full list is in
[design tokens](../reference/design-tokens.md#host-building-blocks).

A right-click on your **own view body** (a list row) goes through `ctx.ui.openMenu(items, { x, y })`,
and the host draws it; [Menus](menus.md#a-menu-on-your-own-view-body) has the rules, and the menu you
draw yourself in a sandboxed surface.

## Your own custom element — the escape hatch

Nothing prevents a **trusted** weaver (one composed at build time through `providePlugins`) from calling
`customElements.define()` itself: it shares the document with the host, and therefore the one global custom
element registry. The platform's UI ladder lists exactly this as its last rung, the escape hatch for "special
graphics" between the host vocabulary and a full iframe.

So it is **allowed, and it is not supported**. There is no `ctx` surface for it, the host never learns about
it, and it is the one contribution shape the platform cannot clean up after you. The four costs below are
the price of the escape hatch. Weigh them before reaching past `<lw-*>`, the `.lw-*` class contracts and
`ctx.ui`.

### 1. It cannot be undone

The registry has no `undefine`, so a tag stays defined for the lifetime of the
document. Every other contribution you make returns a `Disposable` and vanishes when your plugin is
disabled, updated or uninstalled. A defined tag does not.

The sharp edge is the plugin on/off switch. Disabling your plugin runs `deactivate`, re-enabling runs
`activate` **again in the same document**. A second `define()` on an existing tag throws
`NotSupportedError`, the runtime treats that as an activation failure, and your plugin then loses **all**
of its contributions, not just the element. Guard it:

```ts
// inside activate(ctx) — re-enabling the plugin runs this a second time
if (!customElements.get('notes-graph')) {
  customElements.define('notes-graph', NotesGraphElement);
}
```

The same asymmetry means a new version of your element cannot take over at runtime: the constructor that
claimed the tag first keeps it until the page is reloaded.

### 2. It does not travel up the isolation ladder

The registry is **per document**. Your weaver is
deliberately separated from the shell by the Nx boundary so that it _can_ move to the sandbox rung later,
and a `customElements.define()` in the host document is the one thing that silently will not come along.
(The `<lw-*>` family works inside sandboxed iframes only because the host serves the element _script_ into
each one, `/frame-kit/lw-elements.global.js`.) If sandboxing your weaver is ever on the table, this is a
migration cost you are choosing today.

### 3. Nothing manages collisions

`ctx.contributeIcons` is first-wins, dev-warned and disposable because
the host owns that registry; `customElements.define` is a global land grab that throws hard on the second
claim. Prefix your tags with something you own (`notes-graph`, not `graph`). **The `lw-` prefix belongs to
the host** — claiming it collides with a shipped element or shadows one added in a later release.

### 4. Do not offer your tag to other plugins

Whether one plugin may consume another plugin's element is
deliberately undecided. Across the sandbox boundary it cannot work at all: separate registries, and
carrying it over would mean running your code inside someone else's isolation boundary. Treat the element
as private to your own views.

If you go ahead, paint it with the semantic tokens or the `.lw-*` class contracts so that theme, tenant
branding and the text-size setting reach it like everything else. Keep it to the graphics the host
vocabulary genuinely cannot express. Anything with a native equivalent is better served by a class contract
on that native element.

## Where next

- [View state that survives](view-state.md): the `VIEW_STATE` handle a docked surface persists its filters and scroll in.
- [The content area](content-area.md): the same declaration with an address, opened as a tab.
- [Design tokens](../reference/design-tokens.md): the tokens, `<lw-*>` elements and `.lw-*` class contracts in full.
