import { ApplicationRef, Injector } from '@angular/core';
import { provideShellFeatures } from '../../../foundation/shell-features';
import { FeatureSwitches } from '../../../features/feature-switches.service';
import { TestBed } from '@angular/core/testing';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { CommandService } from '../../../commands/command.service';
import { ContentTabsService } from './content-tabs.service';
import { TabMoves } from '../../pane/drag/tab-moves';
import { PaneFocus } from '../../pane/pane-focus';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { registerTabContextMenu, TAB_CONTEXT_MENU } from './tab-context-menu';
import { PopoutService } from '../../../popout/popout.service';
import type { Mock } from 'vitest';

describe('registerTabContextMenu', () => {
  let registry: ContributionRegistry;
  let commands: CommandService;
  let tabs: Record<string, Mock>;
  let tabMoves: Record<string, Mock>;
  let paneFocus: Record<string, Mock>;
  let paneTree: Record<string, Mock>;
  let popoutOpen: Mock;
  let popout: PopoutService;

  beforeEach(() => {
    tabs = {
      close: vi.fn(() => Promise.resolve(true)),
      keep: vi.fn(),
      closeOthers: vi.fn(),
      closeToRight: vi.fn(),
      closeAll: vi.fn(),
      pin: vi.fn(),
      unpin: vi.fn(),
    };
    tabMoves = { splitOut: vi.fn(), pickTarget: vi.fn() };
    paneFocus = { settleOn: vi.fn() };
    paneTree = {
      pinTab: vi.fn(),
      unpinTab: vi.fn(),
      keepTab: vi.fn(),
      primaryId: vi.fn(() => 'main'),
      sourceOf: vi.fn(() => null),
      carriesAddress: vi.fn(() => true),
    };
    popoutOpen = vi.fn();
    popout = { open: popoutOpen } as unknown as PopoutService;
    TestBed.configureTestingModule({
      providers: [
        { provide: ContentTabsService, useValue: tabs },
        { provide: PaneTreeService, useValue: paneTree },
      ],
    });
    registry = TestBed.inject(ContributionRegistry);
    commands = TestBed.inject(CommandService);
    registerTabContextMenu(registry, {
      tabs: TestBed.inject(ContentTabsService),
      tabMoves: tabMoves as unknown as TabMoves,
      paneFocus: paneFocus as unknown as PaneFocus,
      paneTree: TestBed.inject(PaneTreeService),
      popout,
      features: TestBed.inject(FeatureSwitches),
      injector: TestBed.inject(Injector),
    });
    TestBed.inject(ApplicationRef).tick();
  });

  it('contributes the built-in tab commands and their menu items', () => {
    const ids = registry.commands().map((c) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'shell.tab.close',
        'shell.tab.closeOthers',
        'shell.tab.closeRight',
        'shell.tab.closeAll',
        'shell.tab.togglePin',
        'shell.tab.splitRight',
        'shell.tab.splitDown',
        'shell.tab.openInWindow',
        'shell.tab.keepOpen',
        'shell.tab.moveToPane',
      ]),
    );
    expect(
      registry.menuItems().filter((index) => index.menu === TAB_CONTEXT_MENU),
    ).toHaveLength(10);
  });

  it('offers the split entries only to a tab that has company in its pane', () => {
    const splits = registry
      .menuItems()
      .filter((item) => item.command?.startsWith('shell.tab.split'));
    expect(splits).toHaveLength(2);
    for (const item of splits) {
      expect(item.when).toEqual({ closable: true, sole: false });
    }
  });

  it('hands every entry the pane from a context that is not the address-carrying pane', () => {
    const context = {
      tabId: 't1',
      group: 'content',
      paneId: 'p2',
      primary: false,
      pinned: false,
    };
    const pane = { dock: 'content', paneId: 'p2' };
    commands.execute('shell.tab.close', context);
    commands.execute('shell.tab.closeOthers', context);
    commands.execute('shell.tab.closeRight', context);
    commands.execute('shell.tab.closeAll', context);
    commands.execute('shell.tab.togglePin', context);
    commands.execute('shell.tab.splitRight', context);

    expect(tabs['close']).toHaveBeenCalledWith('t1', pane);
    expect(tabs['closeOthers']).toHaveBeenCalledWith('t1', pane);
    expect(tabs['closeToRight']).toHaveBeenCalledWith('t1', pane);
    expect(tabs['closeAll']).toHaveBeenCalledWith(pane);
    expect(paneTree['pinTab']).toHaveBeenCalledWith('content', 'p2', 't1');
    expect(tabs['pin']).not.toHaveBeenCalled();
    expect(tabMoves['splitOut']).toHaveBeenCalledWith('t1', 'row', pane);
  });

  it('hands no pane from the address-carrying pane, so the group path stays', () => {
    const context = {
      tabId: 't1',
      group: 'content',
      paneId: 'main',
      primary: true,
    };
    commands.execute('shell.tab.close', context);
    commands.execute('shell.tab.closeAll', context);
    expect(tabs['close']).toHaveBeenCalledWith('t1', undefined);
    expect(tabs['closeAll']).toHaveBeenCalledWith(undefined);
  });

  it('acts in the pane that holds the tab when the context names none, as from the search', () => {
    const pane = { dock: 'content', paneId: 'p2' };
    paneTree['sourceOf'].mockReturnValue(pane);
    paneTree['carriesAddress'].mockReturnValue(false);
    const context = { tabId: 't1', closable: true, pinned: false };

    commands.execute('shell.tab.close', context);
    commands.execute('shell.tab.closeRight', context);
    commands.execute('shell.tab.togglePin', context);

    expect(tabs['close']).toHaveBeenCalledWith('t1', pane);
    expect(tabs['closeToRight']).toHaveBeenCalledWith('t1', pane);
    expect(paneTree['pinTab']).toHaveBeenCalledWith('content', 'p2', 't1');
    expect(tabs['pin']).not.toHaveBeenCalled();
  });

  it('close/others/right target the tab from the context', () => {
    commands.execute('shell.tab.close', { tabId: 't1' });
    commands.execute('shell.tab.closeOthers', { tabId: 't1' });
    commands.execute('shell.tab.closeRight', { tabId: 't1' });

    expect(tabs['close']).toHaveBeenCalledWith('t1', undefined);
    expect(tabs['closeOthers']).toHaveBeenCalledWith('t1', undefined);
    expect(tabs['closeToRight']).toHaveBeenCalledWith('t1', undefined);
  });

  it('closeAll clears the whole strip, whatever group the context names', () => {
    commands.execute('shell.tab.closeAll', { group: 'editor' });
    expect(tabs['closeAll']).toHaveBeenCalledWith(undefined);
  });

  it('togglePin pins an unpinned tab and unpins a pinned one', () => {
    commands.execute('shell.tab.togglePin', { tabId: 't1', pinned: false });
    expect(tabs['pin']).toHaveBeenCalledWith('t1');

    commands.execute('shell.tab.togglePin', { tabId: 't1', pinned: true });
    expect(tabs['unpin']).toHaveBeenCalledWith('t1');
  });

  it('split right/down move the context tab into a new group', () => {
    commands.execute('shell.tab.splitRight', { tabId: 'doc/a' });
    expect(tabMoves['splitOut']).toHaveBeenCalledWith(
      'doc/a',
      'row',
      undefined,
    );

    commands.execute('shell.tab.splitDown', { tabId: 'doc/a' });
    expect(tabMoves['splitOut']).toHaveBeenCalledWith(
      'doc/a',
      'column',
      undefined,
    );
  });

  it('a preview is kept open from its menu, in the pane that holds it', () => {
    const keep = registry
      .menuItems()
      .find((item) => item.command === 'shell.tab.keepOpen');
    expect(keep?.when).toEqual({ preview: true });

    commands.execute('shell.tab.keepOpen', { tabId: 'doc/a', primary: true });
    expect(tabs['keep']).toHaveBeenCalledWith('doc/a');

    commands.execute('shell.tab.keepOpen', {
      tabId: 'doc/b',
      group: 'content',
      paneId: 'p2',
      primary: false,
    });
    expect(paneTree['keepTab']).toHaveBeenCalledWith('content', 'p2', 'doc/b');
  });

  it('a tab is moved into another pane from its menu, offered only while the area is split', () => {
    const move = registry
      .menuItems()
      .find((item) => item.command === 'shell.tab.moveToPane');
    expect(move?.when).toEqual({ split: true });

    commands.execute('shell.tab.moveToPane', { tabId: 'doc/a', primary: true });
    expect(tabMoves['pickTarget']).toHaveBeenCalledWith('doc/a', {
      dock: 'content',
      paneId: 'main',
    });

    commands.execute('shell.tab.moveToPane', {
      tabId: 'doc/b',
      group: 'content',
      paneId: 'p2',
      primary: false,
    });
    expect(tabMoves['pickTarget']).toHaveBeenCalledWith('doc/b', {
      dock: 'content',
      paneId: 'p2',
    });
  });

  it('closing from the menu puts the focus back on the pane once the tab is gone, not when the question was cancelled', async () => {
    commands.execute('shell.tab.close', {
      tabId: 't1',
      group: 'content',
      paneId: 'p2',
      primary: false,
    });
    await Promise.resolve();
    expect(paneFocus['settleOn']).toHaveBeenCalledWith({
      dock: 'content',
      paneId: 'p2',
    });

    paneFocus['settleOn'].mockClear();
    tabs['close'].mockReturnValue(Promise.resolve(false));
    commands.execute('shell.tab.close', { tabId: 't1', primary: true });
    await Promise.resolve();
    expect(paneFocus['settleOn']).not.toHaveBeenCalled();
  });

  it('falls back to an empty tab id when the context is missing it', () => {
    commands.execute('shell.tab.close', {});
    expect(tabs['close']).toHaveBeenCalledWith('', undefined);
  });

  it('opens the context tab in its own browser window', () => {
    commands.execute('shell.tab.openInWindow', { tabId: 'doc/main' });

    expect(popoutOpen).toHaveBeenCalledWith('doc/main');
  });

  it('drops the close family, the pin entry and a split entry with their capability', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ContentTabsService, useValue: tabs },
        { provide: PaneTreeService, useValue: paneTree },
        provideShellFeatures({
          content: { close: false, pin: false, splitDown: false },
        }),
      ],
    });
    const bed = TestBed.inject(ContributionRegistry);
    registerTabContextMenu(bed, {
      tabs: TestBed.inject(ContentTabsService),
      tabMoves: tabMoves as unknown as TabMoves,
      paneFocus: paneFocus as unknown as PaneFocus,
      paneTree: TestBed.inject(PaneTreeService),
      popout,
      features: TestBed.inject(FeatureSwitches),
      injector: TestBed.inject(Injector),
    });
    TestBed.inject(ApplicationRef).tick();
    const ids = bed.commands().map((command) => command.id);
    expect(ids).not.toContain('shell.tab.close');
    expect(ids).not.toContain('shell.tab.closeOthers');
    expect(ids).not.toContain('shell.tab.togglePin');
    expect(ids).not.toContain('shell.tab.splitDown');
    expect(ids).toContain('shell.tab.splitRight');
    expect(ids).toContain('shell.tab.openInWindow');
    const menuIds = bed.menuItems().map((item) => item.command);
    expect(menuIds).not.toContain('shell.tab.closeAll');
    expect(menuIds).not.toContain('shell.tab.splitDown');
    expect(menuIds).toContain('shell.tab.splitRight');
  });
});
