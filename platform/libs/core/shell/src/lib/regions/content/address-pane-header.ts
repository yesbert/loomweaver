import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
} from '@angular/core';
import { ViewAction } from '@loomweaver/plugin-sdk';
import { CommandService } from '../../commands/command.service';
import { ContentTabsService } from './tabs/content-tabs.service';
import { PaneTargetPicker } from './pane-target-picker';
import { TAB_CONTEXT_MENU } from './tabs/tab-context-menu';
import { VIEW_CONTEXT_MENU } from '../pane/chrome/strip-tab';
import { FeatureSwitches } from '../../features/feature-switches.service';
import {
  CONTENT_DOCK,
  isViewPanePath,
  PaneRef,
} from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { PaneChromeService } from '../pane/chrome/pane-chrome.service';
import { PaneActions } from '../pane/pane-actions.service';
import { escalationStep } from '../pane/chrome/tab-escalation';
import {
  escalationSwitches,
  offersMinimize,
  offersSplitDown,
  offersSplitRight,
  tabsDraggable,
  tabsReorderable,
} from '../pane/chrome/pane-affordances';
import { PaneTabStrip } from '../pane/chrome/pane-tab-strip';
import { StripTab } from '../pane/chrome/strip-tab';
import { PaneToolbar } from '../pane/chrome/pane-toolbar';

@Component({
  selector: 'lw-address-pane-header',
  imports: [PaneTabStrip, PaneToolbar],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './address-pane-header.html',
  host: { class: 'contents' },
})
export class AddressPaneHeader {
  private readonly commands = inject(CommandService);
  private readonly picker = inject(PaneTargetPicker);
  protected readonly tabs = inject(ContentTabsService);
  protected readonly tabContextMenu = TAB_CONTEXT_MENU;
  protected readonly viewContextMenu = VIEW_CONTEXT_MENU;
  protected readonly contentDock = CONTENT_DOCK;
  private readonly chrome = inject(PaneChromeService);
  private readonly actions = inject(PaneActions);
  private readonly paneTree = inject(PaneTreeService);
  protected readonly features = inject(FeatureSwitches).content;

  private readonly urlPaneId = computed(() =>
    this.paneTree.primaryId(CONTENT_DOCK),
  );

  protected readonly addressPane = computed<PaneRef>(() => ({
    dock: CONTENT_DOCK,
    paneId: this.urlPaneId(),
  }));

  protected readonly maximized = computed(() =>
    this.chrome.isMaximized(CONTENT_DOCK, this.urlPaneId()),
  );

  private readonly isSplit = computed(() =>
    this.paneTree.isSplit(CONTENT_DOCK),
  );
  protected readonly activeId = computed(
    () => this.tabs.activeViewPath() ?? this.tabs.activeTabRoot(),
  );
  private readonly splittable = computed(() =>
    this.actions.duplicable(this.activeId()),
  );

  protected readonly canSplitRight = computed(
    () => offersSplitRight(this.features) && this.splittable(),
  );
  protected readonly canSplitDown = computed(
    () => offersSplitDown(this.features) && this.splittable(),
  );

  protected readonly canMinimize = computed(() =>
    offersMinimize(this.features, {
      split: this.isSplit(),
      maximized: this.maximized(),
    }),
  );
  protected readonly canClose = computed(
    () => this.isSplit() && !this.maximized(),
  );

  protected readonly canNewTabFloating = computed(
    () => this.features.newTab() && !this.maximized(),
  );
  protected readonly canSplitRightFloating = computed(
    () => this.canSplitRight() && !this.maximized(),
  );
  protected readonly canSplitDownFloating = computed(
    () => this.canSplitDown() && !this.maximized(),
  );
  protected readonly showFloating = computed(
    () =>
      !this.tabs.showStrip() &&
      (this.canNewTabFloating() ||
        this.canSplitRightFloating() ||
        this.canSplitDownFloating() ||
        this.canMinimize() ||
        this.features.maximize() ||
        this.canClose()),
  );

  protected readonly tabsReorderable = computed(() =>
    tabsReorderable(this.features, true),
  );

  protected readonly tabsDraggable = computed(() =>
    tabsDraggable(this.features, true),
  );

  protected readonly stripTabs = computed<StripTab[]>(() =>
    this.tabs.tabs().map((tab) => ({
      ...tab,
      closable: tab.closable && this.features.close(),
    })),
  );

  protected select(tab: StripTab): void {
    if (isViewPanePath(tab.path)) {
      this.tabs.activateViewTab(tab.path);
      return;
    }
    this.tabs.navigateTo(tab.navPath ?? tab.path);
  }

  protected escalate(tab: StripTab): void {
    const step = escalationStep(tab, escalationSwitches(this.features));
    switch (step) {
      case 'keep': {
        this.tabs.keep(tab.path);
        break;
      }
      case 'pin': {
        this.tabs.pin(tab.path);
        break;
      }
      case 'unpin': {
        this.tabs.unpin(tab.path);
        break;
      }
    }
  }

  protected runAction(action: ViewAction): void {
    this.commands.trigger(action);
  }

  protected onReorder(ids: string[]): void {
    this.tabs.reorder(ids);
  }

  protected toggleMaximize(): void {
    if (this.maximized()) {
      this.actions.restore(CONTENT_DOCK, this.urlPaneId());
      return;
    }
    this.actions.maximize(CONTENT_DOCK, this.urlPaneId());
  }

  protected minimize(): void {
    this.actions.minimize(CONTENT_DOCK, this.urlPaneId());
  }

  protected closePrimary(): void {
    this.actions.close(CONTENT_DOCK, this.urlPaneId());
  }

  protected split(orientation: 'row' | 'column'): void {
    this.actions.split(CONTENT_DOCK, this.urlPaneId(), orientation);
  }

  protected newTab(event: Event): void {
    this.picker.openForNavigation(event.currentTarget as HTMLElement, (path) =>
      this.tabs.navigateTo(path),
    );
  }
}
