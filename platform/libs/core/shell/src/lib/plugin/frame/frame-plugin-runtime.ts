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
import { HostPluginContext } from '../context/host-plugin-context';
import { HostContextFactory } from '../context/host-context-factory';
import { CapabilityGrantService } from '../../permissions/capability-grant.service';
import { PluginEnablementService } from '../enablement/plugin-enablement.service';
import { InstalledPlugin } from '../../plugin-store/lifecycle/installed-plugin';
import { PluginInstallService } from '../../plugin-store/lifecycle/plugin-install.service';
import { CapabilityRefusalReporter } from '../../permissions/capability-refusal';
import { PluginIsolationLevel } from '../../foundation/plugin-isolation-level';
import { CATALOG_MAX_ISOLATION_LEVEL } from '../../plugin-store/catalog/plugin-catalog';
import { PluginIsolationLevelService } from '../../plugin-isolation/plugin-isolation-level.service';
import { PluginDeploymentService } from '../../plugin-store/lifecycle/plugin-deployment.service';
import { FRAME_PLUGIN, FramePlugin } from './frame-plugin';
import {
  RefusedFramePlugin,
  RunnableFramePlugin,
  levelOf,
  runnablePlugins,
  signatureOf,
} from './runnable-frame-plugins';
import { frameRpcMethods } from './rpc/frame-rpc-methods';
import { FrameRemote } from './rpc/frame-rpc-contract';
import { FrameSession } from './frame-session';

interface FrameInstance {
  readonly ctx: HostPluginContext;
  readonly session: FrameSession;
  readonly connection: Connection<FrameRemote>;
  readonly frame: HTMLIFrameElement;
  readonly signature: string;
}

/**
 * Runs each frame plugin in its own hidden iframe, isolated or embedded by its level, and serves its
 * `ctx` over **Penpal** RPC. Every call is answered by the same default-deny capability broker the
 * in-process runtime uses, so a grant means the same at either level: the isolation and the
 * transport change, the broker does not. Data-shaped calls such as `registerSurface({ iframe })` or
 * `toast` cross the boundary as validated copies; a component surface never crosses it.
 *
 * Activation reconciles against the union of three sets: the composed {@link FramePlugin} list,
 * what the operator deployed through the catalog, and what the user installed. Installing activates
 * a plugin live, uninstalling deactivates it, and a catalog that stops carrying a deployed entry
 * deactivates that one, all without a reload. Authority decides an id collision: composed wins over deployed,
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

  private readonly catalogMaxLevel = inject(CATALOG_MAX_ISOLATION_LEVEL);
  private readonly refusals = inject(CapabilityRefusalReporter);

  private readonly store = inject(SETTINGS_STORE);
  private readonly sync = inject(StateSyncService);

  private readonly factory = inject(HostContextFactory);

  private readonly injector = inject(EnvironmentInjector);

  private readonly plugins =
    inject<readonly FramePlugin[]>(FRAME_PLUGIN, { optional: true }) ?? [];

  private readonly instances = new Map<string, FrameInstance>();

  private readonly reportedRefusals = new Set<string>();

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
    instance.session.end();
    instance.ctx.disposeAll();
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
    const { runnable, refused } = runnablePlugins(
      this.plugins,
      installed,
      deployed,
      this.catalogMaxLevel,
    );
    this.reportRefused(refused);
    for (const plugin of runnable) {
      this.enablement.register(plugin.id, plugin.name ?? plugin.id);
      const enabled = !disabled.has(plugin.id);
      const running = this.instances.get(plugin.id);
      if (enabled && !running) {
        this.activate(plugin);
      } else if (!enabled && running) {
        this.deactivate(plugin.id);
      } else if (enabled && running?.signature !== signatureOf(plugin)) {
        this.deactivate(plugin.id);
        this.activate(plugin);
      }
    }
    this.deactivateUnlisted(runnable);
  }

  private deactivateUnlisted(runnable: readonly RunnableFramePlugin[]): void {
    const known = new Set(runnable.map((plugin) => plugin.id));
    for (const id of this.instances.keys()) {
      if (known.has(id)) {
        continue;
      }
      this.deactivate(id);
      this.enablement.unregister(id);
    }
  }

  private reportRefused(refused: readonly RefusedFramePlugin[]): void {
    for (const { id, asked } of refused) {
      const refusal = `${id}|${asked}`;
      if (this.reportedRefusals.has(refusal)) {
        continue;
      }
      this.reportedRefusals.add(refusal);
      console.error(
        `Plugin "${id}" asks to run ${asked}, which this catalog may not confer ` +
          `(it confers at most ${this.catalogMaxLevel}). It is not started.`,
      );
    }
  }

  private activate(plugin: RunnableFramePlugin): void {
    this.grants.register(plugin.id, plugin.capabilities, plugin.granted);
    this.isolation.register(plugin.id, levelOf(plugin));
    const ctx = this.factory.create(plugin.id, (capability) =>
      this.grants.isGranted(plugin.id, capability),
    );
    const session = new FrameSession(ctx.state, this.injector);
    const frame = this.createFrame(plugin.entryUrl, levelOf(plugin));
    const connection = this.connect(plugin, ctx, session, frame);
    session.attach(connection.promise);
    this.instances.set(plugin.id, {
      ctx,
      session,
      connection,
      frame,
      signature: signatureOf(plugin),
    });

    connection.promise.catch((error: unknown) => {
      if (!this.instances.has(plugin.id)) {
        return;
      }

      console.error(`Sandbox plugin "${plugin.id}" failed to connect`, error);
      this.deactivate(plugin.id);
    });
  }

  private connect(
    plugin: RunnableFramePlugin,
    ctx: HostPluginContext,
    session: FrameSession,
    frame: HTMLIFrameElement,
  ): Connection<FrameRemote> {
    return connect<FrameRemote>({
      messenger: new WindowMessenger({
        remoteWindow: frame.contentWindow as Window,
        allowedOrigins: ['*'],
      }),
      methods: frameRpcMethods({
        pluginId: plugin.id,
        ctx,
        origins: plugin.origins,
        session,
        install: this.install,
        store: this.store,
        sync: this.sync,
        reportRefusal: (error) => this.refusals.report(error),
      }),
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
