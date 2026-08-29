import { Component, EnvironmentInjector, Injector, Type, computed, inject, input, output } from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { CONTAINER_HANDLE, ContentRoute } from '@loomweaver/plugin-sdk';
import { View } from '../../layout/view';
import {
  ContributionRegistry,
  RegisteredView,
} from '../../plugin/contribution-registry';
import { AuthContext } from '../../auth/auth-context';
import { ViewMountService } from '../../views/view-mount.service';
import { ViewInstanceSwitcher } from '../../views/view-instance-switcher';
import { ComponentLoader } from '../../views/component-loader.service';
import { isPopoutUrl } from '../../popout/popout-path';
import { AuthRequiredView } from './access/auth-required-view';
import { RouteUnavailableView } from './access/route-unavailable-view';
import { IframeSurface } from './iframe-surface';
import {
  CONTAINER_CONTEXT,
  CONTAINER_PANE_HOST,
} from '../pane/container/container-context';
import { syntheticParamRoute } from './routing/synthetic-route';
import {
  dockedSurfaceInjectorFactory,
  surfaceInjectorFactory,
} from './routing/surface-injector';
import {
  containerChildForPath,
  surfaceForPanePath,
} from '../pane/pane-surface';
import { paramsOfPattern } from './content-path';
import { RetainedComponent } from '../pane/retention/retained-component';
import {
  retainSurfacePath,
  SURFACE_RETENTION,
  surfaceRetentionKey,
  surfaceRetentionMode,
  viewRetentionKey,
} from '../pane/retention/retention-policy';

@Component({
  selector: 'lw-content-secondary-pane',
  imports: [
    AuthRequiredView,
    NgTemplateOutlet,
    RetainedComponent,
    RouteUnavailableView,
    TranslocoPipe,
    ViewInstanceSwitcher,
  ],
  templateUrl: './content-secondary-pane.html',
  host: { '[class]': 'hostClass()' },
})
export class ContentSecondaryPane {
  readonly path = input.required<string>();

  readonly variant = input<'content' | 'panel'>('content');

  readonly instanceId = input<string | undefined>(undefined);

  readonly retentionScope = input<string>('');

  readonly instanceReleased = output<void>();

  private readonly registry = inject(ContributionRegistry);
  private readonly viewMount = inject(ViewMountService);
  private readonly componentLoader = inject(ComponentLoader);
  private readonly auth = inject(AuthContext);
  private readonly injector = inject(Injector);
  private readonly environmentInjector = inject(EnvironmentInjector);

  private readonly paramInjectors = new Map<string, Injector>();
  private readonly injectorFor = surfaceInjectorFactory(
    this.injector,
    this.environmentInjector,
  );
  private readonly dockedInjectorFor = dockedSurfaceInjectorFactory(
    this.injector,
    this.environmentInjector,
  );

  protected readonly iframeComponent = IframeSurface;
  private readonly containerCtx = inject(CONTAINER_CONTEXT);
  private readonly containerHost = inject(CONTAINER_PANE_HOST, {
    optional: true,
  });

  private readonly declared = computed(
    () =>
      surfaceForPanePath(
        this.registry.contentRoutes(),
        this.registry.views(),
        this.path(),
      ) ?? null,
  );

  private readonly declaredView = computed(() => {
    const declared = this.declared();
    return declared !== null && !('path' in declared) ? declared : null;
  });

  private readonly declaredRoute = computed(() => {
    const declared = this.declared();
    return declared !== null && 'path' in declared ? declared : null;
  });

  protected readonly isContainerSurface = computed(
    () => this.declaredRoute()?.container !== undefined,
  );

  private readonly padded = computed(() => this.declared()?.padded !== false);

  protected readonly hostClass = computed(() => {
    if (this.isContainerSurface()) {
      return 'flex h-full min-h-0 min-w-0';
    }
    if (this.variant() === 'panel') {
      return this.padded()
        ? 'block h-full min-h-0 overflow-auto p-3 text-content'
        : 'block h-full min-h-0 overflow-auto text-content';
    }
    return this.padded()
      ? 'block h-full overflow-auto bg-surface-raised p-6 text-content'
      : 'block h-full overflow-auto bg-surface-raised text-content';
  });

  protected readonly unavailableKey = isPopoutUrl(
    inject(DOCUMENT).location?.pathname ?? '',
  )
    ? 'popout.unavailable'
    : 'content.split.unavailable';

  protected readonly blocked = computed(() => {
    const declared = this.declared();
    return declared !== null && !this.auth.meets(declared.access);
  });

  private readonly mountParams = computed(() => {
    const ctx = this.containerCtx;
    if (!ctx) {
      return;
    }
    const match = containerChildForPath(
      this.registry.contentRoutes(),
      this.registry.views(),
      this.path(),
    );
    return {
      ...ctx.params,
      ...(match
        ? paramsOfPattern(match.declaration.segment ?? '', match.segmentPath)
        : {}),
    };
  });

  protected readonly unknown = computed(() => this.declared() === null);

  protected readonly view = computed(() => {
    const view = this.declaredView();
    return view && this.auth.meets(view.access) ? view : null;
  });

  protected readonly showSwitcher = computed(
    () => this.view()?.instanceable === true,
  );

  private readonly retention = inject(SURFACE_RETENTION);

  protected readonly surfaceKey = computed(() =>
    surfaceRetentionKey(this.retentionScope(), this.path()),
  );

  protected readonly surfaceMode = computed(() =>
    surfaceRetentionMode(this.registry.contentRoutes(), this.path()),
  );

  protected readonly surfaceRetain = computed(() =>
    retainSurfacePath(
      this.registry.contentRoutes(),
      this.registry.views(),
      this.path(),
      this.retention,
    ),
  );

  protected readonly viewKey = computed(() =>
    viewRetentionKey(this.retentionScope(), this.path(), this.instanceId()),
  );

  private readonly activeRoute = computed(() => {
    if (this.view() !== null) {
      return null;
    }
    const route = this.declaredRoute();
    return route && this.auth.meets(route.access) ? route : null;
  });

  protected readonly iframeSurface = computed<{
    component: Type<unknown>;
    injector: Injector;
  } | null>(() => {
    const route = this.activeRoute();
    return route?.iframe === undefined
      ? null
      : {
          component: IframeSurface,
          injector: this.injectorFor(route, this.path(), this.surfaceKey()),
        };
  });

  protected readonly surface = computed<{
    component: Type<unknown>;
    injector: Injector;
  } | null>(() => {
    const route = this.activeRoute();
    if (!route || route.iframe !== undefined) {
      return null;
    }
    const component = this.surfaceComponent(route);
    return component
      ? {
          component,
          injector: this.injectorFor(route, this.path(), this.surfaceKey()),
        }
      : null;
  });

  protected componentFor(view: View): Type<unknown> | null {
    return this.componentLoader.resolve(view);
  }

  protected dockedInjector(view: RegisteredView): Injector {
    return this.dockedInjectorFor(
      view,
      this.instanceId() ?? this.viewMount.instanceIdFor(view),
      this.mountParams(),
    );
  }

  protected viewInjector(view: View): Injector {
    const instanceId = this.instanceId();
    const base = instanceId
      ? this.viewMount.injectorForInstance(instanceId)
      : this.viewMount.injectorFor(view);
    return this.containerCtx
      ? this.paramInjectorFor(instanceId ?? view.id, base)
      : base;
  }

  private surfaceComponent(route: ContentRoute): Type<unknown> | null {
    if (route.container !== undefined) {
      return this.containerHost;
    }
    return this.componentLoader.resolve(route);
  }

  private paramInjectorFor(key: string, base: Injector): Injector {
    const cached = this.paramInjectors.get(key);
    if (cached) {
      return cached;
    }
    const handle = this.containerCtx;
    const injector = Injector.create({
      parent: base,
      providers: [
        {
          provide: ActivatedRoute,
          useValue: syntheticParamRoute(this.mountParams() ?? {}),
        },
        {
          provide: CONTAINER_HANDLE,
          useValue: handle ? { open: handle.open } : null,
        },
      ],
    });
    this.paramInjectors.set(key, injector);
    return injector;
  }
}
