import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, afterNextRender, isDevMode, computed, effect, inject, Injector, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { DirtySurface, StateHandle } from '@loomweaver/plugin-sdk';
import { Connection, Methods, WindowMessenger, connect } from 'penpal';
import { LocaleService } from '../../i18n/locale.service';
import { PluginStateService } from '../../plugin/plugin-state.service';
import { ThemeService } from '../../theme/theme.service';
import { ThemeRegistry } from '../../theme/theme-registry';
import { FontScaleService } from '../../text-size/font-scale.service';
import { LW_TOKENS } from '../../theme/theme-registry-global';
import { distributionIcons } from '../../elements/icon/icon-registry-global';
import { AuthContext } from '../../auth/auth-context';
import { CapabilityGrantService } from '../../permissions/capability-grant.service';
import { PluginIsolationLevelService } from '../../foundation/plugin-isolation-level';
import { ContentTabsService } from './tabs/content-tabs.service';
import { normalizePath, restBelow, suffixOf } from './content-path';

interface SurfaceState {
  readonly locale: string;
  readonly tab: string;
  readonly theme: 'light' | 'dark';
  readonly preview: boolean;
  readonly shown: boolean;
  readonly tokens: Record<string, string>;
  readonly rootFontSize: string;
  readonly icons?: Record<string, string>;
  readonly instanceId?: string;
  readonly params?: Record<string, string>;
  readonly rest?: string;
  readonly session?: {
    readonly authenticated: boolean;
    readonly roles: readonly string[];
  };
}

type SurfaceRemote = Methods & {
  render(state: SurfaceState): Promise<void>;
  beforeClose(): Promise<boolean> | boolean;
  stateChanged(key: string, value: unknown, loaded: boolean): void;
};

interface WatchedKey {
  readonly handle: StateHandle;
  readonly stop: () => void;
}

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

  private readonly injector = inject(Injector);

  private readonly watched = new Map<string, WatchedKey>();

  private readonly frame =
    viewChild.required<ElementRef<HTMLIFrameElement>>('frame');

  private readonly host: Element = inject(ElementRef).nativeElement;

  protected readonly src: SafeResourceUrl = inject(
    DomSanitizer,
  ).bypassSecurityTrustResourceUrl(
    this.route.snapshot.data['iframe'] as string,
  );

  private readonly pluginId = this.route.snapshot.data['pluginId'] as
    string | undefined;

  protected readonly isolated =
    this.isolation.levelOf(this.pluginId) === 'isolated';

  private readonly sessionGranted = computed(() => {
    const owner = this.pluginId;
    return owner !== undefined && this.grants.isGranted(owner, 'session');
  });

  private readonly hostMounted = this.route.snapshot.data['urlDriven'] !== true;

  private readonly docked = this.route.snapshot.data['docked'] === true;

  private readonly instanceId = this.route.snapshot.data['instanceId'] as
    string | undefined;

  private readonly routeParams = this.route.snapshot.params as Record<
    string,
    string
  >;

  private readonly ownsRest = this.route.snapshot.data['rest'] === true;

  private readonly hostSub = signal<string>(
    String(this.route.snapshot.data['sub'] ?? ''),
  );

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

  private readonly activeTab = computed(() => {
    if (this.hostMounted) {
      return normalizePath(this.hostSub());
    }
    return restBelow(this.tabRoot, normalizePath(this.currentUrl()));
  });

  private readonly restPath = computed(() => {
    if (!this.ownsRest) {
      return;
    }
    return this.hostMounted
      ? this.hostSub()
      : restBelow(this.tabRoot, this.currentUrl());
  });

  private connection?: Connection<SurfaceRemote>;

  private remote?: SurfaceRemote;

  private readonly dirty = signal(false);

  private readonly isPreview = computed(() =>
    this.hostMounted
      ? false
      : (this.tabs.tabs().find((tab) => tab.path === this.tabRoot)?.preview ??
        false),
  );

  private readonly shown = signal(true);

  private visibility?: IntersectionObserver;

  constructor() {
    afterNextRender(() => {
      this.connect();
      this.watchVisibility();
    });

    effect(() => {
      const snapshot = this.reactiveState();
      this.themes.version();
      this.fontScale.scale();
      queueMicrotask(() => this.push({ ...snapshot, ...this.readResolved() }));
    });
    inject(DestroyRef).onDestroy(() => {
      for (const entry of this.watched.values()) {
        entry.stop();
      }
      this.watched.clear();
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
          if (!this.hostMounted) {
            this.tabs.keep(this.tabRoot);
          }
        },
        setDirty: (dirty: boolean) => this.dirty.set(dirty),
        stateWatch: (key: string) => this.watchState(key),
        stateSet: (key: string, value: unknown) =>
          this.watched.get(key)?.handle.set(value),
        stateClear: (key: string) =>
          this.watched.get(key)?.handle.clear(),
        stateUnwatch: (key: string) => {
          const name = key;
          this.watched.get(name)?.stop();
          this.watched.delete(name);
        },
      },
    });
    this.connection.promise
      .then((remote) => {
        this.remote = remote;
        this.push({ ...this.reactiveState(), ...this.readResolved() });
        for (const [key, entry] of this.watched) {
          this.pushState(key, entry.handle.value(), entry.handle.loaded());
        }
      })
      .catch(() => undefined);
  }

  private watchState(key: string): void {
    const owner = this.pluginId;
    if (owner === undefined || this.watched.has(key)) {
      return;
    }
    const handle = this.pluginState.facade(owner).watch(key);
    const ref = effect(
      () => {
        const value = handle.value();
        const loaded = handle.loaded();
        queueMicrotask(() => this.pushState(key, value, loaded));
      },
      { injector: this.injector },
    );
    this.watched.set(key, {
      handle,
      stop: () => {
        ref.destroy();
        handle.dispose();
      },
    });
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
      tab: this.activeTab(),
      theme: this.theme.resolvedTheme(),
      preview: this.isPreview(),
      shown: this.shown(),
      ...(this.instanceId && { instanceId: this.instanceId }),
      ...(Object.keys(this.routeParams).length > 0 && { params: this.routeParams }),
      ...(rest !== undefined && { rest }),
      ...(this.sessionGranted() && {
            session: {
              authenticated: this.auth.authenticated(),
              roles: this.auth.roles(),
            },
          }),
    };
  }

  private readResolved(): Pick<
    SurfaceState,
    'tokens' | 'rootFontSize' | 'icons'
  > {
    const styles = getComputedStyle(this.document.documentElement);
    const tokens: Record<string, string> = {};
    for (const name of LW_TOKENS) {
      tokens[name] = styles.getPropertyValue(name).trim();
    }
    const icons = distributionIcons();
    return {
      tokens,
      rootFontSize: styles.fontSize,
      ...(Object.keys(icons).length > 0 && { icons }),
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
    const raw = path;
    const suffix = suffixOf(raw);
    const target = normalizePath(raw);
    if (target !== this.tabRoot && !target.startsWith(this.tabRoot + '/')) {
      throw new Error(
        `Surface navigation is confined to its own tab root "${this.tabRoot}" — got "${target}". ` +
          `Use the plugin (logic) channel's ctx.navigateContent for anything else ('navigation' grant).`,
      );
    }
    if (this.hostMounted) {
      this.hostSub.set(restBelow(this.tabRoot, raw));
      return;
    }
    this.tabs.navigateTo(target + suffix);
  }
}
