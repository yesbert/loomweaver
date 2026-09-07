# A navigation tree in the sidebar

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `ui-primitives` · `routing` · `surfaces`. Where this page and a
> specification disagree, the specification is right, and that is a defect in this page: change the
> behaviour there, then explain it here.

A product with more than a handful of routes wants a sidebar that lists them: grouped, folded, and
marking where the user is. The workbench draws that tree for you. You declare the destinations,
it draws them, marks the one the current address lies under, and reports what the user chose. It
navigates nothing on its own, translates nothing, and knows nothing of what a destination means.

This page builds one for the notes weaver, in the order you will meet the parts: the declaration,
reporting and acting, marking, folding, hiding what nobody registered, retitling the panel, the
accessible name, and content inside an item. The whole thing as files to copy is
[recipe 11](../samples.md#a-navigation-tree-in-the-sidebar).

## The declaration is data

The tree is three custom elements, `<lw-nav-tree>`, `<lw-nav-group>` and `<lw-nav-item>`, written
as light-DOM children in your own template. You could write the tags by hand. Do not: a tree
written as literal tags cannot hide a destination nobody registered, cannot be renamed on a
language change, and cannot be tested without a browser. Declare it as data and let the template
draw it.

```ts
// src/notes/src/lib/views/notes-navigation.ts
export interface Destination {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

export interface Group {
  readonly key: string;
  readonly label: string;
  readonly destinations: readonly Destination[];
  readonly startsShut?: boolean;
}

export const NOTES_NAVIGATION = {
  groups: [
    {
      key: 'notes/writing',
      label: 'notes.nav.writing',
      destinations: [
        { path: 'notes', label: 'notes.nav.all', icon: 'document' },
        { path: 'notes/drafts', label: 'notes.nav.drafts', icon: 'edit' },
      ],
    },
    {
      key: 'notes/archive',
      label: 'notes.nav.archive',
      startsShut: true,
      destinations: [{ path: 'notes/archive', label: 'notes.nav.archived', icon: 'lock' }],
    },
  ] as readonly Group[],
  loose: [{ path: 'notes/search', label: 'notes.nav.search', icon: 'search' }] as readonly Destination[],
};
```

The labels are translation keys, because the tree shows text as given and a template pipe is
where it becomes a word. The icons are names from the [shipped set](../reference/icons.md); a
name of your own comes through `ctx.contributeIcons` first. The template draws exactly this shape:

```html
<!-- src/notes/src/lib/views/notes-navigation-view.html -->
<lw-nav-tree
  [attr.current]="shown()"
  [attr.aria-label]="'notes.nav.title' | transloco"
  (lw-nav-select)="open($event)"
>
  @for (group of groups(); track group.key) {
    <lw-nav-group
      [attr.label]="group.label | transloco"
      [attr.key]="group.key"
      [attr.collapsed]="group.startsShut ? '' : null"
    >
      @for (destination of group.destinations; track destination.path) {
        <lw-nav-item
          [attr.path]="destination.path"
          [attr.icon]="destination.icon"
          [attr.label]="destination.label | transloco"
        ></lw-nav-item>
      }
    </lw-nav-group>
  }
  @for (destination of loose; track destination.path) {
    <lw-nav-item
      [attr.path]="destination.path"
      [attr.icon]="destination.icon"
      [attr.label]="destination.label | transloco"
    ></lw-nav-item>
  }
</lw-nav-tree>
```

Two things about the shape are guaranteed, and both matter for a sidebar the user can learn. A
destination may stand outside every group, which is what `loose` draws at the top level beside
the groups. And a group you declare is drawn as a group, including the archive group with its
single destination. Nothing is promoted, merged or flattened on the workbench's judgement. If the
tree changed shape as its contents changed, the user would have to find their way again after
every plugin install.

A product with several modules declares one tree per module, registers each as its own sidebar
surface, and the distribution puts each surface into the sidebar of the module's
[workspace](../distribution/workspaces.md). The demo does exactly that, one navigation surface per
module, and switching the module in the rail switches the tree with it.

## The tree reports, the weaver acts

Choosing a destination fires `lw-nav-select` with the path in `detail.path`, and then nothing
happens until you act. The tree navigates nothing itself, so nothing the tree does can move the
user without your code in between. Acting is one call:

```ts
// src/notes/src/lib/plugin/navigation.ts
import type { PluginContext } from '@loomweaver/plugin-sdk';

let ctx: PluginContext | undefined;
let lastTitle: string | undefined;

export const navigation = {
  bind(next: PluginContext): void {
    ctx = next;
  },
  unbind(): void {
    ctx = undefined;
    lastTitle = undefined;
  },
  activePath(): string {
    return ctx?.activeContent()?.path ?? '';
  },
  showingUnder(path: string): boolean {
    return ctx?.isShowingUnder(path) ?? false;
  },
  go(path: string): void {
    ctx?.navigateContent(path);
  },
  retitle(surfaceId: string, title: string): void {
    if (!ctx || lastTitle === title) {
      return;
    }
    lastTitle = title;
    ctx.retitleSurface(surfaceId, title);
  },
};
```

This module is the bridge between `activate(ctx)` and a component that has no `ctx` of its own;
the [access-gating guide](access-gating.md) uses the same shape for the session. Bind it in
`activate`, unbind it in `deactivate`.

Here is the one place that says which capabilities a sidebar tree needs. Three of the four `ctx`
members above are under `navigation`: `activeContent`, `isShowingUnder` and `navigateContent`.
The fourth, `retitleSurface`, is under `contributions`, which every weaver has. So the manifest
declares both, and the distribution grants both, or the first call throws `CapabilityError`:

```ts
manifest: {
  id: 'notes',
  name: 'Notes',
  capabilities: ['contributions', 'navigation'],
},
```

The component reads the bridge and hands the event's path on:

```ts
// src/notes/src/lib/views/notes-navigation-view.ts
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  effect,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { navigation } from '../plugin/navigation';
import { NOTES_NAVIGATION } from './notes-navigation';

@Component({
  selector: 'lw-notes-navigation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './notes-navigation-view.html',
})
export class NotesNavigationView {
  protected readonly groups = computed(() => NOTES_NAVIGATION.groups);
  protected readonly loose = NOTES_NAVIGATION.loose;
  protected readonly shown = computed(() => navigation.activePath());

  protected open(event: Event): void {
    navigation.go((event as CustomEvent<{ path: string }>).detail.path);
  }
}
```

`CUSTOM_ELEMENTS_SCHEMA` is what lets an Angular template carry tags Angular does not know; the
[sidebar-surfaces guide](sidebar-surfaces.md#what-your-views-own-body-can-use) says why every
`<lw-*>` element is consumed that way. The surface itself is an ordinary docked one:

```ts
// in activate(ctx)
navigation.bind(ctx);
ctx.registerSurface({
  id: 'notes.navigation',
  title: 'notes.nav.title',
  icon: 'notes',
  component: NotesNavigationView,
  docks: ['left-panel'],
  padded: false,
});
```

`padded: false` because the tree draws its own rows edge to edge, the way the workbench's own
lists do, and an inset would leave a gutter beside them.

## Marking where the user is

Tell the tree which address is on screen through `current`, and it marks the destination that
address lies at or under. The template feeds it from `activeContent`, which is signal-shaped, so
the marking moves as the user moves.

The rule for "under" is the workbench's own segment rule, the same one `ctx.isShowingUnder`
applies. `notes/drafts/d-17` is under `notes/drafts`, so opening a draft marks the drafts entry.
`notes/draftsomething` is not under `notes/drafts`, because there is no segment boundary between
them. That is the rule you would otherwise write with `startsWith` and get wrong, and the symptom
is quiet: an entry that never marks, or one that marks its neighbour too.

At most one destination is marked, the longest match, and none at all when the address lies under
no destination the tree holds. So `notes` in the writing group is marked for `notes` and for
nothing deeper, because `notes/drafts` is the longer match for the drafts and their documents.

## Folding

A group folds open and shut on the user's command. It starts open unless you say otherwise, because
a sidebar that hides everything until it is opened tells a first-time user nothing. The
declaration's `startsShut` becomes the `collapsed` attribute. Here is the first of two rules the
page states rather than warns about.

**Drive `collapsed` as present or absent.** It is a boolean attribute: a group is shut when the
attribute exists, whatever its value, so `collapsed="false"` shuts it. In an Angular template that
is `[attr.collapsed]="group.startsShut ? '' : null"`, where `null` removes the attribute. The
template above already does this.

**Give every group a `key`.** What the user folded is kept for the session under the group's
key, and outlives the tree being taken off screen and drawn again. So following a link, or
collapsing the sidebar and opening it again, does not undo the shape the user made. Without a
key the label is used, which works until the label is translated: the user switches language, the
key changes with the word, and every group springs back to its declared state. Give it a value
that outlives a language change and is unique across the trees your product draws. A path prefix
is a good one.

Nothing is kept beyond the session. The tree stores nothing of its own, so a reload starts from
what the declaration says. In a test that draws several trees, `forgetLwNavFolds()` from
`@loomweaver/shell` clears the memory between cases.

A group holding no destinations is still drawn, because you declared it, and offers no fold: a
control that opens nothing is a promise the group cannot keep. When destinations arrive later, the
fold is offered from then on. Whether you want to show an empty group at all is your decision, and
the next section is where it comes up.

## Hiding what nobody registered

A destination in your declaration points at a route some plugin registers. In a product that lets
the distribution switch a plugin off, or the user disable one in the plugin store, that route may
not exist when the tree is drawn. An entry that leads to the "no surface answers here" placeholder
is worse than no entry.

The demo answers this by drawing only what is reachable. `ContributionRegistry` from
`@loomweaver/shell` reports the registered content routes as a signal, so the filter is a computed
over it:

```ts
// in NotesNavigationView, replacing the `groups` line above
import { inject } from '@angular/core';
import { ContributionRegistry } from '@loomweaver/shell';

private readonly registry = inject(ContributionRegistry);

private readonly reachable = computed(
  () => new Set(this.registry.contentRoutes().map((route) => route.path)),
);

protected readonly groups = computed(() =>
  NOTES_NAVIGATION.groups
    .map((group) => ({
      ...group,
      destinations: group.destinations.filter((d) => this.reachable().has(d.path)),
    }))
    .filter((group) => group.destinations.length > 0),
);
```

The last `filter` is the demo's choice, to drop a group left empty. Keep it out if an empty group
should stay visible, and the tree draws it without a fold.

Say where the boundary is: `ContributionRegistry` is the distribution's registry, and injecting it
is what a weaver composed inside the application may do, the way the demo's navigation plugin is.
A weaver published on its own depends on `@loomweaver/plugin-sdk` alone and cannot reach it. Such
a weaver lists the routes it registered itself, which it knows are there, and leaves the product's
cross-plugin navigation to the product.

## Retitling the panel to where the user is

Picture a sidebar whose header says "Writing" while the user is among the drafts, and "Archive"
once they open an archived note. That needs the surface's title to change while the surface runs,
and `ctx.retitleSurface` does that under the id you registered with, and everywhere the workbench names
the surface follows: its tab, the panel header, a picker that lists it. The surface is not rebuilt,
so what the user folded inside it survives.

Drive it from the same fact the marking uses. The group to name is the one holding the deepest
destination the address lies under, and the depth matters: `notes` is under everything the notes
weaver owns, so the first group that matches would always be the one holding it. The tree marks by
the longest match, and the title follows the same rule:

```ts
// in src/notes/src/lib/views/notes-navigation.ts
export function groupShowing(
  groups: readonly Group[],
  showingUnder: (path: string) => boolean,
): Group | undefined {
  let deepest: { readonly group: Group; readonly depth: number } | undefined;
  for (const group of groups) {
    for (const destination of group.destinations) {
      if (showingUnder(destination.path) && destination.path.length > (deepest?.depth ?? -1)) {
        deepest = { group, depth: destination.path.length };
      }
    }
  }
  return deepest?.group;
}
```

```ts
// in NotesNavigationView
constructor() {
  effect(() => {
    const group = groupShowing(this.groups(), (path) => navigation.showingUnder(path));
    navigation.retitle('notes.navigation', group?.label ?? 'notes.nav.title');
  });
}
```

`isShowingUnder` is live in the same way `activeContent` is, so the effect re-runs as the address
moves. A translation key still translates, and still follows a language change. The bridge skips a
retitle to the title already set, so the effect costs nothing while the user stays in one group.

## The accessible name

The tree sets `role="navigation"` on itself, marks the current destination with
`aria-current="page"` rather than by appearance alone, gives each item the button role, and says
on each group heading whether it is expanded. What it cannot supply is the one word that tells a
screen-reader user which navigation this is, among the others on the page. That is the
`aria-label` in the template above, translated like every other label. A product with one tree
per module names each after its module, which is what the demo does.

## Content inside an item

Anything you write inside an item stays on the row after the label. The element neither defines
nor styles it, which is the point: a count, a dot, a small badge, whatever the row should carry.
The `.lw-badge` class contract is the usual choice for a count:

```html
<lw-nav-item path="notes/drafts" icon="edit" [attr.label]="'notes.nav.drafts' | transloco">
  <span class="lw-badge">{{ drafts() }}</span>
</lw-nav-item>
```

## Where next

- [Samples, recipe 11](../samples.md#a-navigation-tree-in-the-sidebar): the files above, whole, with the paths they belong at.
- [Sub-routes and follows](sub-routes-and-follows.md#reading-which-content-is-focused-ctxactivecontent): `activeContent`, `isShowingUnder` and `retitleSurface` on their own.
- [Host building blocks](../reference/design-tokens.md#host-building-blocks): every attribute and event of the three elements, in the table with the other `<lw-*>` elements.
- [Workspaces a product ships](../distribution/workspaces.md): putting one navigation surface into each module's sidebar.
