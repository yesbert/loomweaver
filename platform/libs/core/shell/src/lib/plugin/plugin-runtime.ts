import { effect, EnvironmentInjector, EnvironmentProviders, inject, InjectionToken, isDevMode, provideEnvironmentInitializer, Provider, Service, untracked } from '@angular/core';
import { HostPluginContext } from './host-plugin-context';
import { HostContextFactory } from './host-context-factory';
import { Plugin } from './plugin';
import { CapabilityGrantService } from '../permissions/capability-grant.service';
import { PluginEnablementService } from '../plugin-store/lifecycle/plugin-enablement.service';
import { REQUIRED_PLUGINS } from '../permissions/required-plugins';
import { FRAME_PLUGIN } from './sandbox/frame-plugin';

/** Multi-provider token: each contribution adds one plugin to load. */
export const PLUGIN = new InjectionToken<readonly Plugin[]>('PLUGIN');

/**
 * Activates the registered plugins. Trusted in-process runtime (the lowest isolation
 * rung); this abstraction lets a sandboxed runtime slot in later
 * without touching plugins or the host.
 */
@Service()
export class PluginRuntime {
  private readonly grants = inject(CapabilityGrantService);

  private readonly enablement = inject(PluginEnablementService);

  private readonly required = inject(REQUIRED_PLUGINS);

  private readonly framePlugins = inject(FRAME_PLUGIN, { optional: true }) ?? [];

  private readonly factory = inject(HostContextFactory);

  private readonly injector = inject(EnvironmentInjector);

  private readonly plugins =
    inject<readonly Plugin[]>(PLUGIN, { optional: true }) ?? [];

  private readonly active = new Map<string, HostPluginContext>();

  private started = false;

  activateAll(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    for (const plugin of this.plugins) {
      this.enablement.register(
        plugin.manifest.id,
        plugin.manifest.name ?? plugin.manifest.id,
      );
    }
    this.reportUncomposedRequirements();
    this.reconcile(this.enablement.disabled());
    effect(
      () => {
        const disabled = this.enablement.disabled();
        untracked(() => this.reconcile(disabled));
      },
      { injector: this.injector },
    );
  }

  /**
   * Unloads a plugin: undoes every contribution it made (via its context's tracked
   * disposables) and runs its optional `deactivate` hook. Idempotent — unknown/inactive
   * ids are a no-op. This is the counterpart to {@link activateAll} that keeps the `active`
   * map from being write-only (a real unload path, needed before an untrusted loader lands).
   */
  deactivate(id: string): void {
    const ctx = this.active.get(id);
    if (!ctx) {
      return;
    }
    ctx.disposeAll();
    this.plugins.find((plugin) => plugin.manifest.id === id)?.deactivate?.();
    this.active.delete(id);
    this.grants.unregister(id);
  }

  /** Unloads every active plugin (e.g. on teardown). */
  deactivateAll(): void {
    for (const id of this.active.keys()) {
      this.deactivate(id);
    }
  }

  private reconcile(disabled: ReadonlySet<string>): void {
    for (const plugin of this.plugins) {
      const id = plugin.manifest.id;
      const enabled = !disabled.has(id);
      if (enabled && !this.active.has(id)) {
        this.activate(plugin);
      } else if (!enabled && this.active.has(id)) {
        this.deactivate(id);
      }
    }
  }

  private activate(plugin: Plugin): void {
    const id = plugin.manifest.id;
    this.grants.register(id, plugin.manifest.capabilities);
    let activating = true;
    const ctx = this.factory.create(id, (capability) =>
      activating
        ? this.grants.isBaseGranted(id, capability)
        : this.grants.isGranted(id, capability),
    );
    this.active.set(id, ctx);

    try {
      const result = plugin.activate(ctx);
      if (result instanceof Promise) {
        result.then(
          () => (activating = false),
          (error: unknown) => this.onActivationError(id, error),
        );
      } else {
        activating = false;
      }
    } catch (error) {
      this.onActivationError(id, error);
    }
  }

  private onActivationError(id: string, error: unknown): void {
    this.active.get(id)?.disposeAll();
    this.active.delete(id);
    console.error(`Plugin "${id}" activation failed`, error);
  }

  private reportUncomposedRequirements(): void {
    if (!isDevMode()) {
      return;
    }
    const composed = new Set([
      ...this.plugins.map((plugin) => plugin.manifest.id),
      ...this.framePlugins.map((plugin) => plugin.id),
    ]);
    const missing = this.required.filter((id) => !composed.has(id));
    if (missing.length > 0) {
      console.warn(
        `provideRequiredPlugins names ${missing.join(', ')}, which this distribution does not compose — ignored.`,
      );
    }
  }
}

/** A distribution registers its plugins; they are activated eagerly at startup. */
export function providePlugins(
  ...plugins: Plugin[]
): (Provider | EnvironmentProviders)[] {
  return [
    ...plugins.map((plugin) => ({
      provide: PLUGIN,
      useValue: plugin,
      multi: true,
    })),
    provideEnvironmentInitializer(() => inject(PluginRuntime).activateAll()),
  ];
}
