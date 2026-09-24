import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EnvironmentInjector,
  Injector,
  Type,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { View } from '@loomweaver/plugin-sdk';
import { LayoutRegion, SHELL_LAYOUT } from '../../layout/layout';
import { ViewAction } from '../../views/view';
import { ViewMountService } from '../../views/view-mount.service';
import { ComponentLoader } from '../pane/component-loader.service';
import { ViewInstanceSwitcher } from '../../views/view-instance-switcher';
import { PanelGroupService } from './panel-group.service';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { PaneTreeView } from '../pane/pane-tree-view';
import {
  isViewPanePath,
  viewForPanePath,
  viewPanePath,
} from '../pane/tree/pane-address';
import { PANEL_PANE_OPTIONS } from '../pane/pane-view-options';
import { RetainedComponent } from '../pane/retention/retained-component';
import {
  retainSurfacePath,
  SURFACE_RETENTION,
} from '../pane/retention/retention-policy';
import {
  paneRetentionScope,
  viewRetentionKey,
} from '../pane/retention/retention-keys';
import { SurfaceBody } from '../content/surface/surface-body';
import { IframeSurface } from '../content/surface/iframe-surface';
import { dockedSurfaceInjectorFactory } from '../content/surface/surface-injector';
import {
  ContributionRegistry,
  RegisteredView,
} from '../../contributions/contribution-registry';
import { CommandService } from '../../commands/command.service';
import { AuthContext } from '../../auth/auth-context';
import { ViewportService } from '../../layout/viewport.service';
import {
  SURFACE_PADDING,
  effectivePadding,
} from '../../foundation/surface-padding';
import { ShellBar } from '../bar/shell-bar';
import { PanelState } from './panel-state';
import { PanelSizeService } from './panel-size.service';
import { overlayWidthStyle } from '../../layout/panel-widths';
import { PanelSplitter } from './panel-splitter';
import { FeatureSwitches } from '../../features/feature-switches.service';
import { regionsAt } from '../../layout/layout-queries';

@Component({
  selector: 'lw-shell-panel',
  imports: [
    TranslocoPipe,
    ShellBar,
    PanelSplitter,
    PaneTreeView,
    SurfaceBody,
    RetainedComponent,
    ViewInstanceSwitcher,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './shell-panel.html',
})
export class ShellPanel {
  readonly region = input.required<LayoutRegion>();

  private readonly commands = inject(CommandService);

  private readonly auth = inject(AuthContext);

  private readonly panels = inject(PanelState);

  protected readonly viewport = inject(ViewportService);
  private readonly padding = inject(SURFACE_PADDING);

  protected readonly size = inject(PanelSizeService);

  private readonly layout = inject(SHELL_LAYOUT);

  private readonly panelGroup = inject(PanelGroupService);

  private readonly registry = inject(ContributionRegistry);

  private readonly paneTree = inject(PaneTreeService);

  private readonly viewMount = inject(ViewMountService);

  private readonly componentLoader = inject(ComponentLoader);

  private readonly retention = inject(SURFACE_RETENTION);

  private readonly dockedInjectorFor = dockedSurfaceInjectorFactory(
    inject(Injector),
    inject(EnvironmentInjector),
  );

  protected readonly features = inject(FeatureSwitches).sidebar;

  protected readonly iframeComponent = IframeSurface;

  protected readonly collapsed = computed(
    () => !this.viewport.compact() && this.panels.isCollapsed(this.region().id),
  );

  protected readonly widthStyle = computed(() => {
    const region = this.region();
    if (this.viewport.compact()) {
      return overlayWidthStyle(region.type === 'panel' ? region : {});
    }
    return `${this.collapsed() ? 0 : this.size.width(region.id)}px`;
  });

  protected readonly splitterDock = computed<'left' | 'right' | null>(() => {
    if (
      !this.features.resize() ||
      this.viewport.compact() ||
      this.collapsed()
    ) {
      return null;
    }
    const dock = this.region().dock;
    return dock === 'left' || dock === 'right' ? dock : null;
  });

  protected readonly activePath = computed(() =>
    this.panelGroup.activePath(this.region().id),
  );

  protected readonly activeView = computed(() => {
    const path = this.activePath();
    return path === undefined
      ? undefined
      : viewForPanePath(this.registry.views(), path);
  });

  protected readonly padded = computed(() =>
    effectivePadding(this.activeView()?.padded, this.padding),
  );

  protected readonly activeContentPath = computed(() => {
    const path = this.activePath();
    return path !== undefined && !isViewPanePath(path) ? path : undefined;
  });

  protected readonly actions = computed(() =>
    [...(this.activeView()?.actions ?? [])]
      .filter((action) => this.auth.visible(action.access))
      .toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  );

  protected readonly panelPaneOptions = PANEL_PANE_OPTIONS;

  protected readonly primaryScope = computed(() =>
    paneRetentionScope(
      this.region().id,
      this.paneTree.primaryId(this.region().id),
    ),
  );

  protected readonly tree = computed(() =>
    this.paneTree.tree(this.region().id),
  );

  private readonly shownInstance = computed(() =>
    this.panelGroup.activeInstance(this.region().id),
  );

  protected readonly footers = computed(() =>
    regionsAt(this.layout, this.region().dock, 'bar'),
  );

  constructor() {
    effect(() => this.panelGroup.seed(this.region().id));
  }

  protected viewInjector(view: View): Injector {
    const shown = this.shownInstance();
    return shown
      ? this.viewMount.injectorForInstance(shown)
      : this.viewMount.injectorFor(view);
  }

  protected componentFor(view: View): Type<unknown> | null {
    return this.componentLoader.resolve(view);
  }

  protected dockedInjector(view: RegisteredView): Injector {
    return this.dockedInjectorFor(
      view,
      this.shownInstance() ?? this.viewMount.instanceIdFor(view),
    );
  }

  protected viewKeyFor(view: View): string {
    return viewRetentionKey(
      this.primaryScope(),
      viewPanePath(view.id),
      this.shownInstance(),
    );
  }

  protected viewRetains(view: View): boolean {
    return retainSurfacePath(
      this.registry.contentRoutes(),
      this.registry.views(),
      viewPanePath(view.id),
      this.retention,
    );
  }

  protected releaseCarriedInstance(): void {
    this.panelGroup.clearActiveInstance(this.region().id);
  }

  protected disabled(action: ViewAction): boolean {
    return this.auth.disabled(action.access);
  }

  protected run(action: ViewAction): void {
    if (this.disabled(action)) return;
    this.commands.trigger(action);
  }
}
