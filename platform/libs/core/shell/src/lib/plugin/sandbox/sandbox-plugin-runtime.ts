import { effect, EnvironmentInjector, EnvironmentProviders, inject, InjectionToken, provideEnvironmentInitializer, Provider, Service, untracked } from '@angular/core';
import { Connection, WindowMessenger, connect } from 'penpal';
import {
  Capability,
  StateHandle,
} from '@loomweaver/plugin-sdk';
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
  DEFAULT_ISOLATION_LEVEL,
  PluginIsolationLevel,
  PluginIsolationLevelService,
  exceedsLevel,
} from '../../foundation/plugin-isolation-level';
import { PluginDeploymentService } from '../../plugin-store/lifecycle/plugin-deployment.service';
import {
  FrameSettingValues,
  buildFrameSection,
  sanitizeRpcSettingsSection,
} from './sandbox-settings';
import {
  sanitizeRpcMenuItem,
  sanitizeRpcSurface,
  sanitizeRpcTabInput,
  sanitizeRpcToastInput,
} from './sandbox-rpc-sanitize';
import {
  FrameRemote,
  FrameRpc,
  invokeRpcCommand,
} from './sandbox-rpc-contract';

/**
 * A **sandboxed** plugin a distribution registers: its code is not an in-process
 * {@link Plugin} object but a URL to an isolated document, loaded into an `<iframe sandbox>` and given
 * `ctx` over RPC. Contrast {@link providePlugins} (trusted, in-process).
 */
export interface FramePlugin {
  /** Stable plugin id — the same id the distribution grants capabilities to (default-deny). */
  readonly id: string;
  /**
   * What the workbench calls this plugin where it names it to the user — the permissions surface,
   * the plugin list. Omit it and the id is shown, which is a poor name but a correct one: nothing is
   * derived from it. Grants, collisions and the user's stored decisions all follow {@link id}, never
   * this, so naming a plugin changes what is read and nothing else.
   */
  readonly name?: string;
  /** URL of the plugin's entry document (served by the distribution, e.g. `/my-plugin/plugin.html`). */
  readonly entryUrl: string;
  /** Capabilities the plugin declares it needs; the distribution still has to grant them. */
  readonly capabilities?: readonly Capability[];
  /**
   * Origins this plugin's own surfaces may be served from, beyond the application's own — the seam
   * refuses anything else, and refuses an address that would execute or carry its content inline at
   * any level. Omit it and the application's own origin is the only one, which is the right answer
   * for a plugin whose files the distribution serves itself.
   *
   * A sibling subdomain belongs here: it is what gives an embedded application its own storage and
   * keeps it out of the hosting document, while a session cookie scoped to the shared domain still
   * reaches it.
   */
  readonly origins?: readonly string[];
  /**
   * How much the browser holds this plugin back. Omitted means
   * {@link PluginIsolationLevel `'isolated'`} — the frame is stripped of an origin and reaches
   * neither the hosting document nor any storage. `'embedded'` lets it keep an origin, which is what
   * a first-party application composed for its own deployment needs and what a plugin you did not
   * write must never be given.
   */
  readonly level?: PluginIsolationLevel;
}

/** Multi-provider token: each contribution adds one sandboxed plugin to load. */
export const FRAME_PLUGIN = new InjectionToken<readonly FramePlugin[]>(
  'FRAME_PLUGIN',
);

interface FrameInstance {
  readonly ctx: HostPluginContext;
  readonly connection: Connection<FrameRemote>;
  readonly frame: HTMLIFrameElement;
  readonly signature: string;
  readonly syncCleanups: (() => void)[];
  readonly watched: Map<string, WatchedKey>;
}

interface WatchedKey {
  readonly handle: StateHandle;
  readonly stop: () => void;
}

interface RunnableFramePlugin extends FramePlugin {
  readonly granted?: readonly Capability[];
  readonly version?: string;
  readonly provided?: boolean;
}

function levelOf(plugin: RunnableFramePlugin): PluginIsolationLevel {
  return plugin.level ?? DEFAULT_ISOLATION_LEVEL;
}

function signatureOf(plugin: RunnableFramePlugin): string {
  const sorted = (values: readonly string[] | undefined): string =>
    [...(values ?? [])].toSorted((a, b) => a.localeCompare(b)).join(',');
  return `${plugin.entryUrl}|${sorted(plugin.capabilities)}|${sorted(plugin.granted)}|${plugin.version ?? ''}|${levelOf(plugin)}`;
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
    const runnable = this.runnablePlugins(installed, deployed);
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

  private runnablePlugins(
    installed: readonly InstalledPlugin[],
    deployed: readonly InstalledPlugin[],
  ): readonly RunnableFramePlugin[] {
    const claimed = new Set(this.plugins.map((plugin) => plugin.id));
    const provided = new Set(deployed.map((plugin) => plugin.id));
    const fromCatalog: RunnableFramePlugin[] = [];
    for (const plugin of [...deployed, ...installed]) {
      if (claimed.has(plugin.id)) {
        continue;
      }
      const asked = plugin.level ?? DEFAULT_ISOLATION_LEVEL;
      if (exceedsLevel(asked, this.catalogCap)) {
        console.error(
          `Plugin "${plugin.id}" asks to run ${asked}, which this catalog may not confer ` +
            `(its cap is ${this.catalogCap}). It is not started.`,
        );
        continue;
      }
      claimed.add(plugin.id);
      fromCatalog.push({
        id: plugin.id,
        entryUrl: plugin.entryUrl,
        capabilities: plugin.capabilities,
        name: plugin.name,
        granted: plugin.capabilities ?? [],
        version: plugin.version,
        level: asked,
        provided: provided.has(plugin.id) || undefined,
      });
    }
    return [...this.plugins, ...fromCatalog];
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
      methods: this.reportingRefusals(
        this.rpcMethods(
          plugin.id,
          ctx,
          syncCleanups,
          watched,
          plugin.origins,
        ),
      ),
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
      if (this.instances.has(plugin.id)) {
        console.error(`Sandbox plugin "${plugin.id}" failed to connect`, error);
        this.deactivate(plugin.id);
      }
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

  private reportingRefusals(methods: FrameRpc): FrameRpc {
    const reported = Object.entries(methods).map(([name, method]) => [
      name,
      (...args: unknown[]) => {
        try {
          return (method as (...rest: unknown[]) => unknown)(...args);
        } catch (error) {
          this.refusals.report(error);
          throw error;
        }
      },
    ]);
    return Object.fromEntries(reported) as FrameRpc;
  }

  private rpcMethods(
    pluginId: string,
    ctx: HostPluginContext,
    syncCleanups: (() => void)[],
    watched: Map<string, WatchedKey>,
    origins: readonly string[] | undefined,
  ): FrameRpc {
    return {
      registerSurface: (surface) => {
        ctx.registerSurface(sanitizeRpcSurface(pluginId, surface, origins));
      },
      registerMenuItem: (item) => {
        ctx.registerMenuItem(sanitizeRpcMenuItem(item));
      },
      registerSettingsSection: (section) => {
        const built = buildFrameSection({
          pluginId,
          wire: sanitizeRpcSettingsSection(pluginId, section),
          group: this.install.isInstalled(pluginId)
            ? 'settings.group.community'
            : 'settings.group.plugins',
          store: this.store,
          sync: this.sync,
          notify: (sectionId, values) =>
            this.notifySettings(pluginId, sectionId, values),
        });
        syncCleanups.push(built.disposeSync);
        ctx.registerSettingsSection(built.section);
      },
      navigateContent: (path) => ctx.navigateContent(path),
      openContentTab: (input) => {
        const sanitized = sanitizeRpcTabInput(input);
        ctx.openContentTab({
          ...sanitized,
          onClose: () => this.notifyTabClosed(pluginId, sanitized.path),
        });
      },
      keepContentTab: (path) => ctx.keepContentTab(path),
      pinContentTab: (path) => ctx.pinContentTab(path),
      unpinContentTab: (path) => ctx.unpinContentTab(path),
      closeContentTab: (path) => ctx.closeContentTab(path),
      revealSurface: (id) => ctx.revealSurface(id),
      invokeCommand: (id, args) => invokeRpcCommand(ctx, id, args),
      invocableCommands: () => ctx.invocableCommands(),
      toast: (input) => ctx.ui.toast(sanitizeRpcToastInput(input)),
      stateWatch: (key) => this.watchState(pluginId, ctx, watched, key),
      stateSet: (key, value) => watched.get(key)?.handle.set(value),
      stateClear: (key) => watched.get(key)?.handle.clear(),
      stateUnwatch: (key) => {
        watched.get(key)?.stop();
        watched.delete(key);
      },
    };
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
        untracked(() => this.notifyState(pluginId, key, value, loaded));
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

  private notifyState(
    pluginId: string,
    key: string,
    value: unknown,
    loaded: boolean,
  ): void {
    const instance = this.instances.get(pluginId);
    if (!instance) {
      return;
    }
    void instance.connection.promise
      .then((remote) => remote.stateChanged(key, value, loaded))
      .catch(() => undefined);
  }

  private notifyTabClosed(pluginId: string, path: string): void {
    const instance = this.instances.get(pluginId);
    if (!instance) {
      return;
    }
    void instance.connection.promise
      .then((remote) => remote.contentTabClosed(path))
      .catch(() => undefined);
  }

  private notifySettings(
    pluginId: string,
    sectionId: string,
    values: FrameSettingValues,
  ): void {
    const instance = this.instances.get(pluginId);
    if (!instance) {
      return;
    }
    void instance.connection.promise
      .then((remote) => remote.settingsChanged(sectionId, values))
      .catch(() => undefined);
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
