import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ContentFeatures,
  DEFAULT_SHELL_FEATURES,
  SHELL_FEATURES,
  ShellFeatures,
} from '../../foundation/shell-features';
import { ContentTabsService } from '../content/tabs/content-tabs.service';
import { PaneTargetPicker } from '../content/pane-target-picker.service';
import { PaneChromeService } from './chrome/pane-chrome.service';
import { PaneDragService } from './drag/pane-drag.service';
import { PaneTreeService } from './tree/pane-tree.service';
import { PaneContainersService } from './container/pane-containers.service';
import { CONTAINER_CONTEXT } from './container/container-context';
import { PRIMARY_PANE } from './tree/pane-address';
import { PaneLeaf, leafOf } from './tree/pane-node';
import { PaneView } from './pane-view';
import {
  CONTENT_PANE_OPTIONS,
  PANEL_PANE_OPTIONS,
  PaneViewOptions,
} from './pane-view-options';
import { StripTab } from './chrome/strip-tab';

interface PaneViewInternals {
  onSelectTab(tab: StripTab): void;
  onCloseTab(tab: StripTab): void;
  onUnpinTab(tab: StripTab): void;
  onReorderTabs(order: string[]): void;
  onBodyPointerDown(): void;
  splitPane(orientation: 'row' | 'column'): void;
  closePane(): void;
  toggleMaximize(): void;
  minimize(): void;
  focusPane(): void;
  openPicker(event: Event): void;
  canAddTab(): boolean;
  canSplitRight(): boolean;
  canSplitDown(): boolean;
  canMaximize(): boolean;
  canMinimize(): boolean;
  maximized(): boolean;
  focusable(): boolean;
  onEscalate(tab: StripTab): void;
  canClose(): boolean;
  viewContextMenu(): string;
  stripTabs(): StripTab[];
  path(): string;
  activeTabId(): string;
  instanceId(): string | undefined;
}

const tree = {
  setActiveTab: vi.fn(),
  removeTab: vi.fn(),
  unpinTab: vi.fn(),
  keepTab: vi.fn(),
  pinTab: vi.fn(),
  reorderPaneTabs: vi.fn(),
  splitPane: vi.fn(),
  closePane: vi.fn(),
  collapsePrimary: vi.fn(),
  insertTab: vi.fn(),
  focusPane: vi.fn<(...args: unknown[]) => string | null>(() => 'search'),
  isSplit: vi.fn(() => true),
  tree: vi.fn(() => leafOf('p1', 'doc/a')),
  primaryId: vi.fn(() => 'main'),
};
const containers = {
  insertContainerChild: vi.fn(),
};

const tabs = {
  runCloseHook: vi.fn(),
  activeTabRoot: vi.fn(() => 'home'),
  navigate: vi.fn(),
  navigateTo: vi.fn(),
};
const drag = {
  canHost: vi.fn((path: string) => path.startsWith('view:')),
  routerBound: vi.fn(
    (path: string) => !path.startsWith('view:') && !drag.canHost(path),
  ),
};
const picker = {
  openForHosting: vi.fn((_a: HTMLElement, onPick: (p: string) => void) =>
    onPick('picked'),
  ),
  openForChildren: vi.fn(
    (
      _a: HTMLElement,
      _children: readonly string[],
      onPick: (p: string) => void,
    ) => onPick('view:b'),
  ),
};

function stripTab(path: string): StripTab {
  return {
    path,
    title: path,
    literalTitle: true,
    closable: true,
    preview: false,
    pinned: false,
  };
}

interface BuildExtras {
  readonly leaf?: PaneLeaf;
  readonly containerChildren?: readonly string[];
}

function build(
  options: PaneViewOptions,
  toolbar?: Partial<ContentFeatures>,
  path = 'search',
  extras: BuildExtras = {},
): PaneViewInternals {
  vi.clearAllMocks();
  const features: ShellFeatures = {
    ...DEFAULT_SHELL_FEATURES,
    content: { ...DEFAULT_SHELL_FEATURES.content, ...toolbar },
  };
  const providers: Provider[] = [
    { provide: PaneTreeService, useValue: tree },
    { provide: PaneContainersService, useValue: containers },
    { provide: ContentTabsService, useValue: tabs },
    { provide: PaneDragService, useValue: drag },
    { provide: PaneTargetPicker, useValue: picker },
    { provide: SHELL_FEATURES, useValue: features },
  ];
  if (extras.containerChildren) {
    providers.push({
      provide: CONTAINER_CONTEXT,
      useValue: {
        params: {},
        spec: { children: extras.containerChildren },
        open: vi.fn(),
      },
    });
  }
  TestBed.configureTestingModule({ providers });
  TestBed.overrideComponent(PaneView, { set: { template: '', imports: [] } });
  const fixture = TestBed.createComponent(PaneView);
  fixture.componentRef.setInput('dock', 'content');
  fixture.componentRef.setInput('leaf', extras.leaf ?? leafOf('p1', path));
  fixture.componentRef.setInput('options', options);
  fixture.detectChanges();
  return fixture.componentInstance as unknown as PaneViewInternals;
}

describe('PaneView (content pane)', () => {
  it('derives path/instance/active/strip tabs from the leaf', () => {
    const c = build(CONTENT_PANE_OPTIONS, undefined, 'view:outline');
    expect(c.path()).toBe('view:outline');
    expect(c.activeTabId()).toBe('view:outline');
    expect(c.instanceId()).toBe('p1');
    expect(c.stripTabs().map((t) => t.path)).toEqual(['view:outline']);
  });

  it('honours the toolbar affordances for a content pane', () => {
    const c = build(CONTENT_PANE_OPTIONS);
    expect(c.canAddTab()).toBe(true);
    expect(c.canSplitRight()).toBe(true);
    expect(c.canSplitDown()).toBe(true);
    expect(c.canMaximize()).toBe(true);
    expect(c.canMinimize()).toBe(true);
  });

  it('a distribution can hide toolbar affordances', () => {
    const c = build(CONTENT_PANE_OPTIONS, {
      newTab: false,
      splitRight: false,
      splitDown: false,
      maximize: false,
      minimize: false,
    });
    expect(c.canAddTab()).toBe(false);
    expect(c.canSplitRight()).toBe(false);
    expect(c.canSplitDown()).toBe(false);
    expect(c.canMaximize()).toBe(false);
    expect(c.canMinimize()).toBe(false);
  });

  it('canMinimize needs a split and no active maximize', () => {
    tree.isSplit.mockReturnValueOnce(false);
    expect(build(CONTENT_PANE_OPTIONS).canMinimize()).toBe(false);
  });

  it('selecting a router-bound tab sets it active and hands off focus', () => {
    const c = build(CONTENT_PANE_OPTIONS);
    c.onSelectTab(stripTab('search'));
    expect(tree.setActiveTab).toHaveBeenCalledWith('content', 'p1', 'search');
    expect(tree.focusPane).toHaveBeenCalled();
    expect(tabs.navigateTo).toHaveBeenCalledWith('search');
  });

  it('selecting a tab always offers focus — the tree decides whether the address may move', () => {
    tree.focusPane.mockReturnValueOnce(null);
    const c = build(CONTENT_PANE_OPTIONS);
    c.onSelectTab(stripTab('view:outline'));
    expect(tree.setActiveTab).toHaveBeenCalled();
    expect(tree.focusPane).toHaveBeenCalled();
    expect(tabs.navigateTo).not.toHaveBeenCalled();
  });

  it('selecting an off-router tab hands off focus too', () => {
    const c = build(CONTENT_PANE_OPTIONS, undefined, 'notes');
    c.onSelectTab(stripTab('notes'));
    expect(tree.focusPane).toHaveBeenCalled();
    expect(tabs.navigateTo).toHaveBeenCalled();
  });

  it('never renders a tab for home — the pane shows the home screen instead', () => {
    const c = build(CONTENT_PANE_OPTIONS, undefined, 'doc/a', {
      leaf: {
        kind: 'leaf',
        id: 'p1',
        tabs: [{ path: 'doc/a' }, { path: '' }],
        active: 'doc/a',
      },
    });
    expect(c.stripTabs().map((t) => t.path)).toEqual(['doc/a']);
  });

  it('double-click escalates permanence through the tree (preview, pin, unpin)', () => {
    const c = build(CONTENT_PANE_OPTIONS);
    c.onEscalate({ ...stripTab('doc/a'), preview: true });
    expect(tree.keepTab).toHaveBeenCalledWith('content', 'p1', 'doc/a');

    c.onEscalate(stripTab('doc/a'));
    expect(tree.pinTab).toHaveBeenCalledWith('content', 'p1', 'doc/a');

    c.onEscalate({ ...stripTab('doc/a'), pinned: true });
    expect(tree.unpinTab).toHaveBeenCalledWith('content', 'p1', 'doc/a');
  });

  it('a distribution that switched escalation off keeps double-click inert', () => {
    const c = build(CONTENT_PANE_OPTIONS, { escalate: false });
    c.onEscalate({ ...stripTab('doc/a'), preview: true });
    expect(tree.keepTab).not.toHaveBeenCalled();
  });

  it('closing a route tab runs the close hook; a view tab does not', () => {
    const c = build(CONTENT_PANE_OPTIONS);
    c.onCloseTab(stripTab('search'));
    expect(tree.removeTab).toHaveBeenCalledWith('content', 'p1', 'search');
    expect(tabs.runCloseHook).toHaveBeenCalledWith('search');

    tabs.runCloseHook.mockClear();
    c.onCloseTab(stripTab('view:outline'));
    expect(tabs.runCloseHook).not.toHaveBeenCalled();
  });

  it('unpinning a travelled pinned tab clears the flag on the tree', () => {
    const c = build(CONTENT_PANE_OPTIONS);
    c.onUnpinTab({ ...stripTab('doc/a'), pinned: true });
    expect(tree.unpinTab).toHaveBeenCalledWith('content', 'p1', 'doc/a');
  });

  it('delegates reorder, split, close, maximize and minimize', () => {
    const c = build(CONTENT_PANE_OPTIONS);
    const chrome = TestBed.inject(PaneChromeService);
    c.onReorderTabs(['a', 'b']);
    expect(tree.reorderPaneTabs).toHaveBeenCalledWith('content', 'p1', [
      'a',
      'b',
    ]);
    c.splitPane('row');
    expect(tree.splitPane).toHaveBeenCalledWith(
      'content',
      'p1',
      'row',
      'search',
    );
    c.closePane();
    expect(tree.closePane).toHaveBeenCalledWith('content', 'p1');
    c.toggleMaximize();
    expect(chrome.isMaximized('content', 'p1')).toBe(true);
    c.minimize();
    expect(chrome.isMinimized('content', 'p1')).toBe(true);
  });

  it('a pointer-down hands off focus', () => {
    const c = build(CONTENT_PANE_OPTIONS);
    c.onBodyPointerDown();
    expect(tree.focusPane).toHaveBeenCalled();
  });

  it('focusPane does not navigate when the tree returns null', () => {
    tree.focusPane.mockReturnValueOnce(null);
    const c = build(CONTENT_PANE_OPTIONS);
    c.focusPane();
    expect(tabs.navigateTo).not.toHaveBeenCalled();
  });

  it('openPicker hosts the picked target as a new tab', () => {
    const c = build(CONTENT_PANE_OPTIONS);
    c.openPicker({
      currentTarget: document.createElement('button'),
    } as unknown as Event);
    expect(tree.insertTab).toHaveBeenCalledWith('content', 'p1', 'picked');
  });
});

describe('PaneView (panel pane)', () => {
  it('always allows a new tab and disables split/focus affordances', () => {
    const c = build(PANEL_PANE_OPTIONS, undefined, 'view:outline');
    expect(c.canAddTab()).toBe(true);
    expect(c.canSplitRight()).toBe(false);
    expect(c.canMaximize()).toBe(false);
    c.onBodyPointerDown();
    expect(tree.focusPane).not.toHaveBeenCalled();
  });
});

describe('PaneView (primary leaf — no dead affordances)', () => {
  const primarySoleTab: PaneLeaf = leafOf(PRIMARY_PANE, 'view:a');

  afterEach(() => {
    tree.isSplit.mockImplementation(() => true);
  });

  it('hides tab close and pane close on a sole-leaf primary (closing would be a no-op)', () => {
    tree.isSplit.mockImplementation(() => false);
    const c = build(CONTENT_PANE_OPTIONS, undefined, 'view:a', {
      leaf: primarySoleTab,
    });
    expect(c.stripTabs().every((tab) => !tab.closable)).toBe(true);
    expect(c.canClose()).toBe(false);
  });

  it('offers close again once the dock is split (closing promotes the neighbour)', () => {
    const c = build(CONTENT_PANE_OPTIONS, undefined, 'view:a', {
      leaf: primarySoleTab,
    });
    expect(c.stripTabs().every((tab) => tab.closable)).toBe(true);
    expect(c.canClose()).toBe(true);
  });

  it('closing the primary pane collapses the split instead of a silent no-op', () => {
    const c = build(CONTENT_PANE_OPTIONS, undefined, 'view:a', {
      leaf: primarySoleTab,
    });
    c.closePane();
    expect(tree.collapsePrimary).toHaveBeenCalledWith('content');
    expect(tree.closePane).not.toHaveBeenCalled();
  });
});

describe('PaneView (container pane — sealing)', () => {
  it('suppresses the view context menu inside a container', () => {
    const c = build(CONTENT_PANE_OPTIONS, undefined, 'view:a', {
      containerChildren: ['a', 'b'],
    });
    expect(c.viewContextMenu()).toBe('');
  });

  it('offers the view context menu outside a container', () => {
    const c = build(CONTENT_PANE_OPTIONS, undefined, 'view:a');
    expect(c.viewContextMenu()).not.toBe('');
  });

  it('the inner picker inserts children container-scoped', () => {
    const c = build(CONTENT_PANE_OPTIONS, undefined, 'view:a', {
      containerChildren: ['a', 'b'],
    });
    c.openPicker({
      currentTarget: document.createElement('button'),
    } as unknown as Event);
    expect(picker.openForChildren).toHaveBeenCalled();
    expect(containers.insertContainerChild).toHaveBeenCalledWith(
      'content',
      { children: ['a', 'b'] },
      'p1',
      'b',
    );
  });
});
