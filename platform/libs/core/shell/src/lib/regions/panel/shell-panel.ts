import { Component, CUSTOM_ELEMENTS_SCHEMA, EnvironmentInjector, Injector, Type, computed, effect, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { View } from '@loomweaver/plugin-sdk';
import { LayoutRegion, SHELL_LAYOUT } from '../../layout/layout';
import { ViewAction } from '../../layout/view';
import { ViewMountService } from '../../views/view-mount.service';
import { ComponentLoader } from '../../views/component-loader.service';
import { ViewInstanceSwitcher } from '../../views/view-instance-switcher';
import { PanelGroupService } from './panel-group.service';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { PaneTreeView } from '../pane/pane-tree-view';
import { VIEW_PANE_PREFIX, viewForPanePath } from '../pane/tree/pane-address';
import { PANEL_PANE_OPTIONS } from '../pane/pane-view-options';
import { RetainedComponent } from '../pane/retention/retained-component';
import {
  paneRetentionScope,
  retainSurfacePath,
  SURFACE_RETENTION,
  viewRetentionKey,
} from '../pane/retention/retention-policy';
import { ContentSecondaryPane } from '../content/content-secondary-pane';
import { IframeSurface } from '../content/iframe-surface';
import { dockedSurfaceInjectorFactory } from '../content/routing/surface-injector';
import {
  ContributionRegistry,
  RegisteredView,
} from '../../plugin/contribution-registry';
import { CommandService } from '../../commands/command.service';
import { AuthContext } from '../../auth/auth-context';
import { ViewportService } from '../../layout/viewport.service';
import { ShellBar } from '../bar/shell-bar';
import { PanelState } from './panel-state';
import { PanelSizeService } from './panel-size.service';
import { PanelSplitter } from './panel-splitter';
import { SHELL_FEATURES } from '../../foundation/shell-features';

@Component({
  selector: 'lw-shell-panel',
  imports: [
    TranslocoPipe,
    ShellBar,
    PanelSplitter,
    PaneTreeView,
    ContentSecondaryPane,
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

  protected readonly features = inject(SHELL_FEATURES).sidebar;

  protected readonly iframeComponent = IframeSurface;

  protected readonly collapsed = computed(
    () => !this.viewport.compact() && this.panels.isCollapsed(this.region().id),
  );

  protected readonly widthPx = computed(() => {
    if (this.viewport.compact()) {
      return null;
    }
    return this.collapsed() ? 0 : this.size.width(this.region().id);
  });

  protected readonly splitterDock = computed<'left' | 'right' | null>(() => {
    if (!this.features.resize || this.viewport.compact() || this.collapsed()) {
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
    if (!path?.startsWith(VIEW_PANE_PREFIX)) {
      return;
    }
    return viewForPanePath(this.registry.views(), path);
  });

  protected readonly activeContentPath = computed(() => {
    const path = this.activePath();
    return path !== undefined && !path.startsWith(VIEW_PANE_PREFIX)
      ? path
      : undefined;
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

  protected readonly footers = computed(() =>
    this.layout.regions.filter(
      (r) => r.type === 'bar' && r.dock === this.region().dock,
    ),
  );

  constructor() {
    effect(() => this.panelGroup.seed(this.region().id));
  }

  protected viewInjector(view: View): Injector {
    const carried = this.panelGroup.activeInstance(this.region().id);
    return carried
      ? this.viewMount.injectorForInstance(carried)
      : this.viewMount.injectorFor(view);
  }

  protected componentFor(view: View): Type<unknown> | null {
    return this.componentLoader.resolve(view);
  }

  protected dockedInjector(view: RegisteredView): Injector {
    const carried = this.panelGroup.activeInstance(this.region().id);
    return this.dockedInjectorFor(
      view,
      carried ?? this.viewMount.instanceIdFor(view),
    );
  }

  protected viewKeyFor(view: View): string {
    const carried = this.panelGroup.activeInstance(this.region().id);
    return viewRetentionKey(
      this.primaryScope(),
      VIEW_PANE_PREFIX + view.id,
      carried ?? undefined,
    );
  }

  protected viewRetains(view: View): boolean {
    return retainSurfacePath(
      this.registry.contentRoutes(),
      this.registry.views(),
      VIEW_PANE_PREFIX + view.id,
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
