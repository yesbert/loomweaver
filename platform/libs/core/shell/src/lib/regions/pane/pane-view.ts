import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
  input,
} from '@angular/core';
import { CONTENT_DOCK, VIEW_PANE_PREFIX } from './tree/pane-address';
import { PaneLeaf, activeTab, leafPath } from './tree/pane-node';
import { CONTAINER_CONTEXT } from './container/container-context';
import { isContainerDock } from './container/container-children';
import { PaneTreeService } from './tree/pane-tree.service';
import { PaneContainersService } from './container/pane-containers.service';
import { PaneChromeService } from './chrome/pane-chrome.service';
import { PaneActions } from './pane-actions.service';
import { TabDragSource } from './drag/pane-drag.service';
import { PaneTabStrip } from './chrome/pane-tab-strip';
import { StripTab } from './chrome/strip-tab';
import { PaneToolbar } from './chrome/pane-toolbar';
import { escalationStep } from './chrome/tab-escalation';
import { toStripTab } from './drag/pane-label';
import { RetainedViewStash } from './retention/retained-view-stash';
import {
  containerChildInstances,
  paneRetentionScope,
} from './retention/retention-policy';
import { SurfaceCloseGuard } from './close/surface-close-guard';
import { TranslocoPipe } from '@jsverse/transloco';
import { ContentSecondaryPane } from '../content/content-secondary-pane';
import { isHomePath } from '../content/content-path';
import { PaneTargetPicker } from '../content/pane-target-picker.service';
import { ContentTabsService } from '../content/tabs/content-tabs.service';
import { FeatureSwitches } from '../../features/feature-switches.service';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { VIEW_CONTEXT_MENU } from '../panel/view-context-menu';
import { CONTENT_PANE_OPTIONS, PaneViewOptions } from './pane-view-options';

@Component({
  selector: 'lw-pane-view',
  imports: [ContentSecondaryPane, PaneTabStrip, PaneToolbar, TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'flex min-h-0 min-w-0 flex-1 flex-col' },
  templateUrl: './pane-view.html',
})
export class PaneView {
  readonly dock = input.required<string>();
  readonly leaf = input.required<PaneLeaf>();
  readonly options = input<PaneViewOptions>(CONTENT_PANE_OPTIONS);

  private readonly features = inject(FeatureSwitches).content;
  private readonly paneTree = inject(PaneTreeService);
  private readonly actions = inject(PaneActions);
  private readonly containers = inject(PaneContainersService);
  private readonly registry = inject(ContributionRegistry);
  private readonly picker = inject(PaneTargetPicker);
  private readonly tabs = inject(ContentTabsService);
  private readonly chrome = inject(PaneChromeService);
  private readonly containerCtx = inject(CONTAINER_CONTEXT);
  private readonly stash = inject(RetainedViewStash);
  private readonly closeGuard = inject(SurfaceCloseGuard);

  protected readonly canAddTab = computed(() =>
    this.options().body === 'panel' ? true : this.features.newTab(),
  );

  protected readonly canSplitRight = computed(
    () => this.options().split && this.features.splitRight(),
  );

  protected readonly canSplitDown = computed(
    () => this.options().split && this.features.splitDown(),
  );

  protected readonly canMaximize = computed(
    () => this.options().maximize && this.features.maximize(),
  );

  protected readonly maximized = computed(() =>
    this.chrome.isMaximized(this.dock(), this.leaf().id),
  );

  protected readonly canMinimize = computed(
    () =>
      this.options().split &&
      this.features.minimize() &&
      !this.maximized() &&
      this.paneTree.isSplit(this.dock()),
  );

  protected readonly viewContextMenu = computed(() =>
    this.containerCtx ? '' : VIEW_CONTEXT_MENU,
  );

  protected readonly source = computed<TabDragSource>(() => ({
    dock: this.dock(),
    paneId: this.leaf().id,
  }));

  protected readonly path = computed(() => leafPath(this.leaf()) ?? '');

  protected readonly awaitingContent = computed(
    () => this.leaf().declared === true && this.leaf().tabs.length === 0,
  );

  protected readonly retentionScope = computed(() =>
    paneRetentionScope(this.dock(), this.leaf().id),
  );

  protected readonly instanceId = computed(
    () => activeTab(this.leaf())?.instance,
  );

  protected readonly activeTabId = computed(
    () => activeTab(this.leaf())?.path ?? '',
  );

  private readonly isPrimary = computed(
    () => this.leaf().id === this.paneTree.primaryId(this.dock()),
  );

  protected readonly canClose = computed(
    () => !this.isPrimary() || this.paneTree.isSplit(this.dock()),
  );

  private readonly tabsClosable = computed(
    () =>
      (!this.isPrimary() || this.canCloseLastPrimaryTab()) &&
      (!this.contentSide() || this.features.close()),
  );

  private readonly contentSide = computed(
    () => this.dock() === CONTENT_DOCK || isContainerDock(this.dock()),
  );

  protected readonly tabsReorderable = computed(
    () => !this.contentSide() || this.features.reorderTabs(),
  );

  protected readonly acceptsTabs = computed(
    () => !this.contentSide() || this.features.moveTabs(),
  );

  protected readonly tabsDraggable = computed(
    () =>
      !this.contentSide() ||
      this.features.reorderTabs() ||
      this.features.moveTabs() ||
      this.features.splitRight() ||
      this.features.splitDown(),
  );

  protected readonly stripTabs = computed<StripTab[]>(() => {
    const closable = this.tabsClosable();
    return this.leaf()
      .tabs.filter((tab) => !isHomePath(tab.path))
      .map((tab) => ({
        ...toStripTab(this.registry, tab),
        closable: closable && tab.closable !== false,
      }));
  });

  protected readonly focusable = computed(() => this.options().focus);

  protected readonly pointed = computed(
    () =>
      this.options().pointer &&
      this.leaf().id === this.paneTree.primaryId(this.dock()),
  );

  protected onBodyPointerDown(): void {
    this.point();
    if (this.focusable()) {
      this.focusPane();
    }
  }

  protected onSelectTab(tab: StripTab): void {
    this.paneTree.setActiveTab(this.dock(), this.leaf().id, tab.path);
    this.point();
    if (this.focusable()) {
      this.focusPane();
    }
  }

  protected onEscalate(tab: StripTab): void {
    if (!this.contentSide()) {
      return;
    }
    const step = escalationStep(tab, {
      escalate: this.features.escalate(),
      pin: this.features.pin(),
    });
    if (step !== null) {
      this.paneTree[`${step}Tab`](this.dock(), this.leaf().id, tab.path);
    }
  }

  protected onCloseTab(tab: StripTab): void {
    this.closeGuard.guarded(this.closeCandidates(tab.path), () => {
      this.paneTree.removeTab(this.dock(), this.leaf().id, tab.path);
      if (!tab.path.startsWith(VIEW_PANE_PREFIX)) {
        this.tabs.runCloseHook(tab.path);
      }
    });
  }

  protected onUnpinTab(tab: StripTab): void {
    this.paneTree.unpinTab(this.dock(), this.leaf().id, tab.path);
  }

  protected releaseTabInstance(): void {
    this.paneTree.clearTabInstance(this.dock(), this.leaf().id, this.path());
  }

  protected onReorderTabs(order: string[]): void {
    this.paneTree.reorderPaneTabs(this.dock(), this.leaf().id, order);
  }

  protected splitPane(orientation: 'row' | 'column'): void {
    this.actions.split(this.dock(), this.leaf().id, orientation);
  }

  protected closePane(): void {
    this.actions.close(this.dock(), this.leaf().id);
  }

  protected toggleMaximize(): void {
    if (this.maximized()) {
      this.actions.restore(this.dock(), this.leaf().id);
      return;
    }
    this.actions.maximize(this.dock(), this.leaf().id);
  }

  protected minimize(): void {
    this.actions.minimize(this.dock(), this.leaf().id);
  }

  protected focusPane(): void {
    this.actions.focus(this.dock(), this.leaf().id);
  }

  protected openPicker(event: Event): void {
    const anchor = event.currentTarget as HTMLElement;
    const ctx = this.containerCtx;
    if (ctx) {
      this.picker.openForChildren(anchor, ctx.spec, (path) =>
        this.containers.insertContainerChild(
          this.dock(),
          ctx.spec,
          this.leaf().id,
          path.slice(VIEW_PANE_PREFIX.length),
        ),
      );
      return;
    }
    this.picker.openForHosting(anchor, (path) =>
      this.paneTree.insertTab(this.dock(), this.leaf().id, path),
    );
  }

  private point(): void {
    if (this.options().pointer) {
      this.paneTree.pointAt(this.dock(), this.leaf().id);
    }
  }

  private canCloseLastPrimaryTab(): boolean {
    return this.leaf().tabs.length > 1 || this.paneTree.isSplit(this.dock());
  }

  private closeCandidates(path: string): unknown[] {
    return [
      ...this.stash.instancesFor(this.retentionScope(), path),
      ...containerChildInstances(this.stash.keyedInstances(), path),
    ];
  }
}
