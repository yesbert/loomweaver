import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  isDevMode,
  computed,
  effect,
  inject,
  Injector,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { DirtySurface } from '@loomweaver/plugin-sdk';
import { Connection, WindowMessenger, connect } from 'penpal';
import { LocaleService } from '../../../i18n/locale.service';
import { PluginStateService } from '../../../plugin/plugin-state.service';
import { ThemeService } from '../../../theme/theme.service';
import { ThemeRegistry } from '../../../theme/theme-registry';
import { FontScaleService } from '../../../text-size/font-scale.service';
import { AuthContext } from '../../../auth/auth-context';
import { CapabilityGrantService } from '../../../permissions/capability-grant.service';
import { PluginIsolationLevelService } from '../../../plugin-isolation/plugin-isolation-level.service';
import { ContentTabsService } from '../tabs/content-tabs.service';
import { normalizePath, restBelow, suffixOf } from '../content-path';
import {
  SurfaceCapture,
  SurfaceDrawing,
  askSurfaceToDraw,
} from '../../../capture/surface-capture';
import { SurfaceCaptureRegistry } from '../../../capture/surface-capture-registry';
import {
  confinedTarget,
  resolvedLook,
  SurfaceRemote,
  SurfaceState,
} from './iframe-surface-protocol';
import { PluginStateBridge } from './plugin-state-bridge';
import { surfaceRouteData } from './surface-route-data';

@Component({
  selector: 'lw-iframe-surface',
  imports: [TranslocoPipe],
  templateUrl: './iframe-surface.html',
})
export class IframeSurface implements DirtySurface {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly locale = inject(LocaleService);

  private readonly theme = inject(ThemeService);

  private readonly auth = inject(AuthContext);

  private readonly grants = inject(CapabilityGrantService);

  private readonly isolation = inject(PluginIsolationLevelService);

  private readonly tabs = inject(ContentTabsService);

  private readonly themes = inject(ThemeRegistry);

  private readonly fontScale = inject(FontScaleService);

  private readonly document = inject(DOCUMENT);

  private readonly pluginState = inject(PluginStateService);

  private readonly captureRegistry = inject(SurfaceCaptureRegistry);

  private readonly transloco = inject(TranslocoService);

  private readonly injector = inject(Injector);

  private readonly frame =
    viewChild.required<ElementRef<HTMLIFrameElement>>('frame');

  private readonly host: Element = inject(ElementRef).nativeElement;

  private readonly data = surfaceRouteData(this.route.snapshot.data);

  protected readonly src: SafeResourceUrl = inject(
    DomSanitizer,
  ).bypassSecurityTrustResourceUrl(this.data.iframe as string);

  private readonly pluginId = this.data.pluginId;

  private readonly stateBridge = new PluginStateBridge(
    this.pluginId === undefined
      ? undefined
      : this.pluginState.forPlugin(this.pluginId),
    this.injector,
    (key, value, loaded) => this.pushState(key, value, loaded),
  );

  protected readonly isolated =
    this.isolation.levelOf(this.pluginId) === 'isolated';

  private readonly sessionGranted = computed(() => {
    const owner = this.pluginId;
    return owner !== undefined && this.grants.isGranted(owner, 'session');
  });

  private readonly routeData = toSignal(
    this.route.data.pipe(map(surfaceRouteData)),
    { initialValue: this.data },
  );

  private readonly hostMounted = computed(() => !this.routeData().urlDriven);

  private readonly docked = this.data.docked === true;

  private readonly instanceId = this.data.instanceId;

  private readonly routeParams = this.route.snapshot.params as Record<
    string,
    string
  >;

  private readonly ownsRest = this.data.rest === true;

  private readonly hostSub = linkedSignal(() => this.routeData().sub ?? '');

  private readonly tabRoot = this.route.snapshot.pathFromRoot
    .flatMap((route) => route.url.map((segment) => segment.path))
    .join('/');

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  private readonly subPath = computed(() => {
    if (this.hostMounted()) {
      return normalizePath(this.hostSub());
    }
    return restBelow(this.tabRoot, normalizePath(this.currentUrl()));
  });

  private readonly restPath = computed(() => {
    if (!this.ownsRest) {
      return;
    }
    return this.hostMounted()
      ? this.hostSub()
      : restBelow(this.tabRoot, this.currentUrl());
  });

  private connection?: Connection<SurfaceRemote>;

  private remote?: SurfaceRemote;

  private readonly dirty = signal(false);

  private readonly isPreview = computed(() =>
    this.hostMounted()
      ? false
      : (this.tabs.tabs().find((tab) => tab.path === this.tabRoot)?.preview ??
        false),
  );

  private readonly shown = signal(true);

  private visibility?: IntersectionObserver;

  constructor() {
    const unregister = this.captureRegistry.register({
      element: this.host,
      captureSelf: (drawing) => this.surfaceCapture(drawing),
    });

    afterNextRender(() => {
      this.connect();
      this.watchVisibility();
    });

    effect(() => {
      const snapshot = this.reactiveState();
      this.themes.revision();
      this.fontScale.scale();
      queueMicrotask(() =>
        this.push({ ...snapshot, ...resolvedLook(this.document) }),
      );
    });
    inject(DestroyRef).onDestroy(() => {
      unregister();
      this.stateBridge.stopAll();
      this.visibility?.disconnect();
      this.connection?.destroy();
    });
  }

  surfaceDirty(): boolean {
    return this.dirty();
  }

  surfaceBeforeClose(): boolean | Promise<boolean> {
    const hook = this.remote?.beforeClose;
    if (typeof hook !== 'function') {
      return true;
    }
    return Promise.resolve()
      .then(() => hook())
      .then(
        (approved) => approved !== false,
        () => true,
      );
  }

  surfaceCapture(drawing: SurfaceDrawing): Promise<SurfaceCapture | undefined> {
    return askSurfaceToDraw(
      this.remote?.capture,
      drawing,
      this.transloco.translate('capture.areaWithheld'),
    );
  }

  private connect(): void {
    const remoteWindow = this.frame().nativeElement.contentWindow;
    if (!remoteWindow) {
      return;
    }

    const messenger = new WindowMessenger({
      remoteWindow,
      allowedOrigins: ['*'],
    });
    this.connection = connect<SurfaceRemote>({
      messenger,
      methods: {
        navigate: (path: string) => this.navigateWithinTabRoot(path),
        keep: () => {
          if (!this.hostMounted()) {
            this.tabs.keep(this.tabRoot);
          }
        },
        setDirty: (dirty: boolean) => this.dirty.set(dirty),
        stateWatch: (key: string) => this.stateBridge.watch(key),
        stateSet: (key: string, value: unknown) =>
          this.stateBridge.set(key, value),
        stateClear: (key: string) => this.stateBridge.clear(key),
        stateUnwatch: (key: string) => this.stateBridge.unwatch(key),
      },
    });
    this.connection.promise
      .then((remote) => {
        this.remote = remote;
        this.push({ ...this.reactiveState(), ...resolvedLook(this.document) });
        this.stateBridge.replay();
      })
      .catch(() => undefined);
  }

  private pushState(key: string, value: unknown, loaded: boolean): void {
    try {
      this.remote?.stateChanged(key, value, loaded);
    } catch {
      this.remote = undefined;
    }
  }

  private watchVisibility(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    this.visibility = new IntersectionObserver((entries) => {
      const last = entries.at(-1);
      if (last) {
        this.shown.set(last.isIntersecting);
      }
    });
    this.visibility.observe(this.host);
  }

  private push(state: SurfaceState): void {
    try {
      this.remote?.render(state).catch(() => undefined);
    } catch {
      this.remote = undefined;
    }
  }

  private reactiveState(): Omit<SurfaceState, 'tokens' | 'rootFontSize'> {
    const rest = this.restPath();
    return {
      locale: this.locale.lang(),
      tab: this.subPath(),
      theme: this.theme.resolvedTheme(),
      preview: this.isPreview(),
      shown: this.shown(),
      ...(this.instanceId && { instanceId: this.instanceId }),
      ...(Object.keys(this.routeParams).length > 0 && {
        params: this.routeParams,
      }),
      ...(rest !== undefined && { rest }),
      ...(this.sessionGranted() && {
        session: {
          authenticated: this.auth.authenticated(),
          roles: this.auth.roles(),
        },
      }),
    };
  }

  private navigateWithinTabRoot(path: string): void {
    if (this.docked) {
      if (isDevMode()) {
        console.warn(
          `[loom] a docked surface asked to navigate to "${path}" — ignored. ` +
            `A docked surface has no address of its own; the channel's navigate is confined to a tab ` +
            `root and there is none. Use ctx.navigateContent (the 'navigation' grant) instead.`,
        );
      }
      return;
    }
    const target = confinedTarget(this.tabRoot, path);
    if (this.hostMounted()) {
      this.hostSub.set(restBelow(this.tabRoot, path));
      return;
    }
    this.tabs.navigateTo(target + suffixOf(path));
  }
}
