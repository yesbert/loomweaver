import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
  input,
} from '@angular/core';
import { CONTENT_DOCK, PaneRef, VIEW_PANE_PREFIX } from './tree/pane-address';
import { PaneLeaf, activeTab, leafPath } from './tree/pane-node';
import { CONTAINER_CONTEXT } from './container/container-context';
import { isContentSideDock } from './container/container-children';
import { PaneTreeService } from './tree/pane-tree.service';
import { PaneContainersService } from './container/pane-containers.service';
import { PaneChromeService } from './chrome/pane-chrome.service';
import { PaneActions } from './pane-actions.service';
import { PaneTabStrip } from './chrome/pane-tab-strip';
import { StripTab } from './chrome/strip-tab';
import { PaneToolbar } from './chrome/pane-toolbar';
import { escalationStep } from './chrome/tab-escalation';
import {
  escalationSwitches,
  offersMinimize,
  offersSplitDown,
  offersSplitRight,
  tabsDraggable,
  tabsReorderable,
} from './chrome/pane-affordances';
import { toStripTab } from './chrome/tab-label';
import { paneRetentionScope } from './retention/retention-keys';
import { TranslocoPipe } from '@jsverse/transloco';
import { RouterOutlet } from '@angular/router';
import { AddressPaneHeader } from '../content/address-pane-header';
import { AddressPaneBody } from '../content/address-pane-body';
import { UnusableWorkspaceNotice } from '../../workspace/usability/unusable-workspace-notice';
import { SurfaceBody } from '../content/surface/surface-body';
import { isHomePath } from '../content/content-path';
import { PaneTargetPicker } from '../content/pane-target-picker';
import { ContentTabsService } from '../content/tabs/content-tabs.service';
import { TAB_CONTEXT_MENU } from '../content/tabs/tab-context-menu';
import { FeatureSwitches } from '../../features/feature-switches.service';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { VIEW_CONTEXT_MENU } from './chrome/strip-tab';
import { CONTENT_PANE_OPTIONS, PaneViewOptions } from './pane-view-options';

@Component({
  selector: 'lw-pane-view',
  imports: [
    AddressPaneHeader,
    SurfaceBody,
    PaneTabStrip,
    PaneToolbar,
    RouterOutlet,
    TranslocoPipe,
    UnusableWorkspaceNotice,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: {
    class: 'relative flex min-h-0 min-w-0 flex-1 flex-col',
    '[attr.data-address-pane]': 'carriesAddress() || null',
  },
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
  private readonly addressPaneBody = inject(AddressPaneBody);

  protected readonly canAddTab = computed(() =>
    this.options().body === 'panel' ? true : this.features.newTab(),
  );

  protected readonly canSplitRight = computed(
    () => this.options().split && offersSplitRight(this.features),
  );

  protected readonly canSplitDown = computed(
    () => this.options().split && offersSplitDown(this.features),
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
      offersMinimize(this.features, {
        split: this.paneTree.isSplit(this.dock()),
        maximized: this.maximized(),
      }),
  );

  protected readonly viewContextMenu = computed(() =>
    this.containerCtx ? '' : VIEW_CONTEXT_MENU,
  );

  protected readonly tabContextMenu = computed(() =>
    this.containerCtx || this.dock() !== CONTENT_DOCK ? '' : TAB_CONTEXT_MENU,
  );

  protected readonly pane = computed<PaneRef>(() => ({
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

  protected readonly carriesAddress = computed(() =>
    this.paneTree.carriesAddress(this.pane()),
  );

  protected readonly bodyPath = computed(() =>
    this.carriesAddress()
      ? this.addressPaneBody.pathFor(this.leaf())
      : this.path(),
  );

  protected readonly bodyInstance = computed(() =>
    this.carriesAddress()
      ? this.addressPaneBody.instanceFor(this.leaf())
      : this.instanceId(),
  );

  protected readonly showsSurface = computed(
    () => !this.carriesAddress() || this.addressPaneBody.showsSurface(),
  );

  protected readonly canClose = computed(
    () => !this.isPrimary() || this.paneTree.isSplit(this.dock()),
  );

  private readonly tabsClosable = computed(
    () =>
      (!this.isPrimary() || this.canCloseLastPrimaryTab()) &&
      (!this.contentSide() || this.features.close()),
  );

  private readonly contentSide = computed(() => isContentSideDock(this.dock()));

  protected readonly tabsReorderable = computed(() =>
    tabsReorderable(this.features, this.contentSide()),
  );

  protected readonly acceptsTabs = computed(
    () => !this.contentSide() || this.features.moveTabs(),
  );

  protected readonly tabsDraggable = computed(() =>
    tabsDraggable(this.features, this.contentSide()),
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
    () => this.options().pointer && this.isPrimary(),
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
    const step = escalationStep(tab, escalationSwitches(this.features));
    switch (step) {
      case 'keep': {
        this.paneTree.keepTab(this.dock(), this.leaf().id, tab.path);
        break;
      }
      case 'pin': {
        this.paneTree.pinTab(this.dock(), this.leaf().id, tab.path);
        break;
      }
      case 'unpin': {
        this.paneTree.unpinTab(this.dock(), this.leaf().id, tab.path);
        break;
      }
    }
  }

  protected onCloseTab(tab: StripTab): void {
    this.tabs.close(tab.path, this.pane());
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
}
