import { computed, Service, signal, Signal, WritableSignal } from '@angular/core';
import { Command, ContentRoute, Disposable, MenuItem } from '@loomweaver/plugin-sdk';
import { BarItem } from '../foundation/bar-item';
import { RailItem } from '../foundation/rail-item';
import { View } from '../layout/view';
import { Identified, upsertBy, upsertById } from '../foundation/identified';
import { isRouteOmitted } from './route-omit';
import {
  RegisteredContentRoute,
  RegisteredSurface,
  RegisteredView,
  contentRouteToEntry,
  entryToContentRoute,
  entryToView,
  viewToEntry,
} from './surface-normalize';

export type { Disposable } from '@loomweaver/plugin-sdk';
export type {
  RegisteredContentRoute,
  RegisteredView,
} from './surface-normalize';

/**
 * A command as the registry holds it: the declaration a plugin handed in, plus the owner the host
 * stamped on it. The owner is what lets a command be attributed — to let its own plugin reach it
 * without a grant, and to tell a plugin's commands from the shell's own.
 */
export interface RegisteredCommand {
  readonly command: Command;
  readonly ownerId?: string;
}

const NO_ROUTES: readonly RegisteredContentRoute[] = [];

/**
 * Holds the live UI contributions the regions render. Seeded at startup from the
 * static `provide*` API and (P1.2 loader) added to at runtime by plugins. Signal-
 * based so the regions react to runtime registration/removal.
 *
 * Contributions are keyed by `id`: registering an existing id **overrides** the
 * previous entry in place (last contribution wins — a distribution/plugin can
 * replace a host default by reusing its id), and `remove*ById` drops one (a
 * distribution hides a default it does not want, e.g. via `provideShell({ omit })`).
 *
 * Override is **destructive**, not stacked: the superseded entry is replaced, so disposing
 * the *winning* handle removes the id entirely (it does not restore the entry it replaced),
 * and disposing a *superseded* handle is a no-op. That is fine for today's usage (defaults are
 * overridden at composition time and never disposed); a per-id stack that reveals the previous
 * entry on dispose is the follow-up if a plugin ever overrides a default and is then unloaded.
 */
@Service()
export class ContributionRegistry {
  private readonly commandsSignal = signal<readonly RegisteredCommand[]>([]);

  private readonly surfacesSignal = signal<readonly RegisteredSurface[]>([]);

  private readonly barItemsSignal = signal<readonly BarItem[]>([]);

  private readonly railItemsSignal = signal<readonly RailItem[]>([]);

  private readonly menuItemsSignal = signal<readonly MenuItem[]>([]);

  private readonly dockedSurfaces = computed(() =>
    this.surfacesSignal().filter((entry) => entry.routable === undefined),
  );

  private readonly routableSurfaces = computed(() =>
    this.surfacesSignal().filter((entry) => entry.routable !== undefined),
  );

  private readonly omittedSignal = signal<ReadonlySet<string>>(new Set());

  /** Registered commands with their owner — the source for anything that has to attribute one. */
  readonly registeredCommands: Signal<readonly RegisteredCommand[]> = computed(
    () => {
      const omitted = this.omittedSignal();
      const entries = this.commandsSignal();
      return omitted.size === 0
        ? entries
        : entries.filter((entry) => !omitted.has(entry.command.id));
    },
  );

  /** Registered commands — the invocable actions triggers (items/keybindings/palette) point at. */
  readonly commands: Signal<readonly Command[]> = computed(() =>
    this.registeredCommands().map((entry) => entry.command),
  );

  readonly views: Signal<readonly RegisteredView[]> = computed(() => {
    const omitted = this.omittedSignal();
    const docked = this.dockedSurfaces();
    const visible =
      omitted.size === 0
        ? docked
        : docked.filter(
            (entry) => entry.id === undefined || !omitted.has(entry.id),
          );
    return visible.map(entryToView);
  });

  readonly barItems: Signal<readonly BarItem[]> = this.visible(
    this.barItemsSignal,
  );

  readonly railItems: Signal<readonly RailItem[]> = this.visible(
    this.railItemsSignal,
  );

  /**
   * URL-addressed content-area routes; the ContentRouter mirrors these into the Router.
   * Omitted routes are filtered out, so every consumer — tab strip, auto-open, pane target
   * picker, `matchRoute` — drops them without knowing about omission.
   */
  readonly contentRoutes: Signal<readonly RegisteredContentRoute[]> = computed(
    () => {
      const routes = this.routableSurfaces().map(entryToContentRoute);
      const omitted = this.omittedSignal();
      if (omitted.size === 0) {
        return routes;
      }
      return routes.filter((route) => !isRouteOmitted(route, omitted));
    },
  );

  /**
   * The routes {@link omit} dropped. The ContentRouter still maps these to a neutral
   * "not available here" placeholder at their path, so a shared deep-link explains itself instead of
   * silently falling back to home.
   */
  readonly omittedContentRoutes: Signal<readonly RegisteredContentRoute[]> =
    computed(() => {
      const omitted = this.omittedSignal();
      if (omitted.size === 0) {
        return NO_ROUTES;
      }
      return this.routableSurfaces()
        .map(entryToContentRoute)
        .filter((route) => isRouteOmitted(route, omitted));
    });

  /** Menu-slot contributions; the MenuService filters these by slot + `when` when a menu opens. */
  readonly menuItems: Signal<readonly MenuItem[]> = this.visible(
    this.menuItemsSignal,
  );

  /** The ids {@link omit} hides, exactly as the distribution wrote them, prefixes and all. */
  readonly omitted: Signal<ReadonlySet<string>> =
    this.omittedSignal.asReadonly();

  /**
   * Every id registered so far, of whatever kind, **including** those {@link omit} hides. An
   * omitted contribution is by construction absent from every other signal here, so this is the
   * only way to tell an `omit` that hid something from one that hit nothing at all.
   */
  readonly registeredIds: Signal<ReadonlySet<string>> = computed(() => {
    const ids = new Set<string>();
    for (const entry of this.commandsSignal()) {
      ids.add(entry.command.id);
    }
    for (const surface of this.surfacesSignal()) {
      if (surface.id !== undefined) {
        ids.add(surface.id);
      }
    }
    const optionallyIdentified: readonly (readonly {
      readonly id?: string;
    }[])[] = [
      this.barItemsSignal(),
      this.railItemsSignal(),
      this.menuItemsSignal(),
    ];
    for (const list of optionallyIdentified) {
      for (const item of list) {
        if (item.id !== undefined) {
          ids.add(item.id);
        }
      }
    }
    return ids;
  });

  /**
   * Hides contributions by id for good — a distribution drops a default it does not want
   * (`provideShell({ omit })`). Unlike {@link removeCommandById} and friends, which delete what is
   * registered *now*, this is a lasting filter: an id a plugin registers later stays hidden too.
   */
  omit(ids: readonly string[]): void {
    if (ids.length === 0) {
      return;
    }
    this.omittedSignal.update((current) => new Set([...current, ...ids]));
  }

  /**
   * Adds a command. Like {@link addContentRoute}, `pluginId` is stamped by the host and never
   * claimed by the plugin: it is what decides whether a caller is reaching its own command or
   * another's. The shell's own seeded commands carry none.
   */
  addCommand(command: Command, pluginId?: string): Disposable {
    const entry: RegisteredCommand = { command, ownerId: pluginId };
    this.commandsSignal.update((entries) =>
      upsertBy(entries, entry, (existing) => existing.command.id === command.id),
    );
    return {
      dispose: () =>
        this.commandsSignal.update((entries) =>
          entries.filter((existing) => existing !== entry),
        ),
    };
  }

  /**
   * Adds a panel view. Like {@link addContentRoute}, `pluginId` is stamped by the host, never by
   * the plugin, and overwrites anything the view carried.
   */
  addView(view: View, pluginId?: string): Disposable {
    return this.addSurface(viewToEntry(view, pluginId));
  }

  addBarItem(item: BarItem): Disposable {
    return this.add(this.barItemsSignal, item);
  }

  addRailItem(item: RailItem): Disposable {
    return this.add(this.railItemsSignal, item);
  }

  removeCommandById(id: string): void {
    this.commandsSignal.update((entries) =>
      entries.filter((entry) => entry.command.id !== id),
    );
  }

  removeViewById(id: string): void {
    this.surfacesSignal.update((entries) =>
      entries.filter((e) => e.routable !== undefined || e.id !== id),
    );
  }

  removeBarItemById(id: string): void {
    this.removeById(this.barItemsSignal, id);
  }

  removeRailItemById(id: string): void {
    this.removeById(this.railItemsSignal, id);
  }

  /**
   * Adds a content route (keyed by `path`; a re-registered path overrides in place). `pluginId` is
   * stamped by the host, never by the plugin: it is what lets a route's surface be checked against its
   * owner's capability grants, so it is applied last and overwrites anything the route carried.
   */
  addContentRoute(route: ContentRoute, pluginId?: string): Disposable {
    return this.addSurface(contentRouteToEntry(route, pluginId));
  }

  /** Adds a menu-slot item. With an `id` a re-registration replaces in place (last-in wins); without one the item is additive and dispose removes this exact contribution. */
  addMenuItem(item: MenuItem): Disposable {
    this.menuItemsSignal.update((items) =>
      upsertBy(items, item, (i) => item.id !== undefined && i.id === item.id),
    );
    return {
      dispose: () =>
        this.menuItemsSignal.update((items) => items.filter((i) => i !== item)),
    };
  }

  removeMenuItemById(id: string): void {
    this.menuItemsSignal.update((items) => items.filter((i) => i.id !== id));
  }

  private addSurface(entry: RegisteredSurface): Disposable {
    this.surfacesSignal.update((entries) =>
      upsertBy(entries, entry, sameSlotAs(entry)),
    );
    return {
      dispose: () =>
        this.surfacesSignal.update((entries) =>
          entries.filter((e) => e !== entry),
        ),
    };
  }

  private visible<T extends { readonly id?: string }>(
    source: Signal<readonly T[]>,
  ): Signal<readonly T[]> {
    return computed(() => {
      const omitted = this.omittedSignal();
      if (omitted.size === 0) {
        return source();
      }
      return source().filter(
        (item) => item.id === undefined || !omitted.has(item.id),
      );
    });
  }

  private add<T extends Identified>(
    target: WritableSignal<readonly T[]>,
    item: T,
  ): Disposable {
    target.update((items) => upsertById(items, item));

    return {
      dispose: () => target.update((items) => items.filter((i) => i !== item)),
    };
  }

  private removeById<T extends Identified>(
    target: WritableSignal<readonly T[]>,
    id: string,
  ): void {
    target.update((items) => items.filter((i) => i.id !== id));
  }
}

function sameSlotAs(
  entry: RegisteredSurface,
): (existing: RegisteredSurface) => boolean {
  const path = entry.routable?.path;
  if (path !== undefined) {
    return (existing) => existing.routable?.path === path;
  }
  return (existing) =>
    existing.routable === undefined &&
    existing.id !== undefined &&
    existing.id === entry.id;
}
