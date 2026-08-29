import {
  EnvironmentInjector,
  EnvironmentProviders,
  Provider,
  Service,
  effect,
  inject,
  provideEnvironmentInitializer,
  untracked,
} from '@angular/core';
import { Connection, WindowMessenger, connect } from 'penpal';
import { SETTINGS_STORE } from '../../persistence/settings-store';
import { StateSyncService } from '../../persistence/state-sync.service';
import { HostPluginContext } from '../host-plugin-context';
import { HostContextFactory } from '../host-context-factory';
import { CapabilityGrantService } from '../../permissions/capability-grant.service';
import { PluginEnablementService } from '../../plugin-store/lifecycle/plugin-enablement.service';
import { InstalledPlugin } from '../../plugin-store/installed-plugin';
import { PluginInstallService } from '../../plugin-store/lifecycle/plugin-install.service';
import { CapabilityRefusalReporter } from '../../permissions/capability-refusal';
import {
  CATALOG_MAX_ISOLATION_LEVEL,
  PluginIsolationLevel,
  PluginIsolationLevelService,
} from '../../foundation/plugin-isolation-level';
import { PluginDeploymentService } from '../../plugin-store/lifecycle/plugin-deployment.service';
import { FRAME_PLUGIN, FramePlugin } from './frame-plugin';
import {
  RunnableFramePlugin,
  levelOf,
  runnablePlugins,
  signatureOf,
} from './sandbox-runnable-plugins';
import { WatchedKey, frameRpcMethods } from './sandbox-rpc-methods';
import { FrameRemote } from './sandbox-rpc-contract';

interface FrameInstance {
  readonly ctx: HostPluginContext;
  readonly connection: Connection<FrameRemote>;
  readonly frame: HTMLIFrameElement;
  readonly signature: string;
  readonly syncCleanups: (() => void)[];
  readonly watched: Map<string, WatchedKey>;
}

/**
 * Second {@link PluginRuntime} implementation:
 * runs each plugin in an isolated `<iframe sandbox="allow-scripts">` and hands it `ctx` over **Penpal**
 * RPC. The RPC endpoints are backed by the **same** {@link HostPluginContext} the trusted runtime uses,
 * so the default-deny capability broker enforces grants identically — the isolation and
 * transport change, the broker does not. Data-oriented `ctx` calls (`registerRoute({iframe})`, `toast`)
 * serialise across the boundary; the reserved Angular-only surface (`component`) never crosses it.
 *
 * Activation reconciles against the union of three sets: the composed {@link FramePlugin} list,
 * what the operator deployed through the catalog, and what the user installed. Installing spawns a
 * plugin live, uninstalling unloads it, and a catalog that stops carrying a deployed entry unloads
 * that one — all without a reload. Authority decides an id collision: composed wins over deployed,
 * and deployed wins over installed, because a deployed entry holds exactly what it names and a
 * user's consent cannot narrow what the operator issued.
 */
@Service()
export class FramePluginRuntime {
  private readonly grants = inject(CapabilityGrantService);

  private readonly enablement = inject(PluginEnablementService);

  private readonly install = inject(PluginInstallService);

  private readonly deployment = inject(PluginDeploymentService);

  private readonly isolation = inject(PluginIsolationLevelService);

  private readonly catalogCap = inject(CATALOG_MAX_ISOLATION_LEVEL);
  private readonly refusals = inject(CapabilityRefusalReporter);

  private readonly store = inject(SETTINGS_STORE);
  private readonly sync = inject(StateSyncService);

  private readonly factory = inject(HostContextFactory);

  private readonly injector = inject(EnvironmentInjector);

  private readonly plugins =
    inject<readonly FramePlugin[]>(FRAME_PLUGIN, { optional: true }) ?? [];

  private readonly instances = new Map<string, FrameInstance>();

  private started = false;

  activateAll(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.install.markComposed(this.plugins.map((plugin) => plugin.id));
    this.reconcile(
      this.enablement.disabled(),
      this.install.installed(),
      this.deployment.deployed(),
    );
    effect(
      () => {
        const disabled = this.enablement.disabled();
        const installed = this.install.installed();
        const deployed = this.deployment.deployed();
        untracked(() => this.reconcile(disabled, installed, deployed));
      },
      { injector: this.injector },
    );
  }

  /**
   * Unloads one sandboxed plugin: closes the RPC connection, removes the frame, disposes `ctx`
   * (undoing its contributions). Idempotent — unknown/inactive ids are a no-op; the counterpart
   * to the trusted runtime's `deactivate(id)`.
   */
  deactivate(id: string): void {
    const instance = this.instances.get(id);
    if (!instance) {
      return;
    }
    this.instances.delete(id);
    instance.connection.destroy();
    instance.frame.remove();
    instance.watched.forEach((entry) => entry.stop());
    instance.ctx.disposeAll();
    instance.syncCleanups.forEach((cleanup) => cleanup());
    this.grants.unregister(id);
    this.isolation.unregister(id);
  }

  /** Tears down every sandboxed plugin (e.g. on teardown). */
  deactivateAll(): void {
    const ids = [...this.instances.keys()];
    for (const id of ids) {
      this.deactivate(id);
    }
  }

  private reconcile(
    disabled: ReadonlySet<string>,
    installed: readonly InstalledPlugin[],
    deployed: readonly InstalledPlugin[],
  ): void {
    const runnable = runnablePlugins(
      this.plugins,
      installed,
      deployed,
      this.catalogCap,
    );
    for (const plugin of runnable) {
      this.enablement.register(plugin.id, plugin.name ?? plugin.id);
      const enabled = plugin.provided === true || !disabled.has(plugin.id);
      const running = this.instances.get(plugin.id);
      if (enabled && !running) {
        this.spawn(plugin);
      } else if (!enabled && running) {
        this.deactivate(plugin.id);
      } else if (enabled && running?.signature !== signatureOf(plugin)) {
        this.deactivate(plugin.id);
        this.spawn(plugin);
      }
    }
    this.dropUninstalled(runnable);
  }

  private dropUninstalled(runnable: readonly RunnableFramePlugin[]): void {
    const known = new Set(runnable.map((plugin) => plugin.id));
    for (const id of this.instances.keys()) {
      if (known.has(id)) {
        continue;
      }
      this.deactivate(id);
      this.enablement.unregister(id);
    }
  }

  private spawn(plugin: RunnableFramePlugin): void {
    this.grants.register(plugin.id, plugin.capabilities, plugin.granted);
    this.isolation.register(plugin.id, levelOf(plugin));
    const ctx = this.factory.create(plugin.id, (capability) =>
      this.grants.isGranted(plugin.id, capability),
    );
    const frame = this.createFrame(plugin.entryUrl, levelOf(plugin));
    const messenger = new WindowMessenger({
      remoteWindow: frame.contentWindow as Window,
      allowedOrigins: ['*'],
    });
    const syncCleanups: (() => void)[] = [];
    const watched = new Map<string, WatchedKey>();
    const connection = connect<FrameRemote>({
      messenger,
      methods: frameRpcMethods({
        pluginId: plugin.id,
        ctx,
        origins: plugin.origins,
        install: this.install,
        store: this.store,
        sync: this.sync,
        syncCleanups,
        watched,
        watchState: (key) => this.watchState(plugin.id, ctx, watched, key),
        notify: (send) => this.notify(plugin.id, send),
        reportRefusal: (error) => this.refusals.report(error),
      }),
    });
    this.instances.set(plugin.id, {
      ctx,
      connection,
      frame,
      signature: signatureOf(plugin),
      syncCleanups,
      watched,
    });

    connection.promise.catch((error: unknown) => {
      if (!this.instances.has(plugin.id)) {
        return;
      }

      console.error(`Sandbox plugin "${plugin.id}" failed to connect`, error);
      this.deactivate(plugin.id);
    });
  }

  private createFrame(
    entryUrl: string,
    level: PluginIsolationLevel,
  ): HTMLIFrameElement {
    const frame = document.createElement('iframe');
    if (level === 'isolated') {
      frame.setAttribute('sandbox', 'allow-scripts');
    }
    frame.setAttribute('aria-hidden', 'true');
    frame.style.display = 'none';
    frame.src = entryUrl;
    document.body.append(frame);
    return frame;
  }

  private watchState(
    pluginId: string,
    ctx: HostPluginContext,
    watched: Map<string, WatchedKey>,
    key: string,
  ): void {
    if (watched.has(key)) {
      return;
    }
    const handle = ctx.state.watch(key);
    const ref = effect(
      () => {
        const value = handle.value();
        const loaded = handle.loaded();
        untracked(() =>
          this.notify(pluginId, (remote) =>
            remote.stateChanged(key, value, loaded),
          ),
        );
      },
      { injector: this.injector },
    );
    watched.set(key, {
      handle,
      stop: () => {
        ref.destroy();
        handle.dispose();
      },
    });
  }

  private notify(
    pluginId: string,
    send: (remote: FrameRemote) => void,
  ): void {
    const instance = this.instances.get(pluginId);
    if (!instance) {
      return;
    }
    void instance.connection.promise.then(send).catch(() => undefined);
  }
}

/** A distribution registers its sandboxed plugins; they are activated eagerly at startup. */
export function provideFramePlugins(
  ...plugins: FramePlugin[]
): (Provider | EnvironmentProviders)[] {
  return [
    ...plugins.map((plugin) => ({
      provide: FRAME_PLUGIN,
      useValue: plugin,
      multi: true,
    })),
    provideEnvironmentInitializer(() =>
      inject(FramePluginRuntime).activateAll(),
    ),
  ];
}
