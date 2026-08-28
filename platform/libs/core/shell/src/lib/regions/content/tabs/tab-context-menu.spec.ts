import { DEFAULT_SHELL_FEATURES } from '../../../foundation/shell-features';
import { TestBed } from '@angular/core/testing';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { CommandService } from '../../../commands/command.service';
import { ContentTabsService } from './content-tabs.service';
import { PaneMoveService } from '../../pane/drag/pane-move.service';
import { registerTabContextMenu, TAB_CONTEXT_MENU } from './tab-context-menu';
import { PopoutService } from '../../../popout/popout.service';
import type { Mock } from 'vitest';

describe('registerTabContextMenu', () => {
  let registry: ContributionRegistry;
  let commands: CommandService;
  let tabs: Record<string, Mock>;
  let paneMove: Record<string, Mock>;
  let popoutOpen: Mock;
  let popout: PopoutService;

  beforeEach(() => {
    tabs = {
      close: vi.fn(),
      closeOthers: vi.fn(),
      closeToRight: vi.fn(),
      closeAll: vi.fn(),
      pin: vi.fn(),
      unpin: vi.fn(),
    };
    paneMove = { splitFromUrlGroup: vi.fn() };
    popoutOpen = vi.fn();
    popout = { open: popoutOpen } as unknown as PopoutService;
    TestBed.configureTestingModule({
      providers: [
        { provide: ContentTabsService, useValue: tabs },
        { provide: PaneMoveService, useValue: paneMove },
      ],
    });
    registry = TestBed.inject(ContributionRegistry);
    commands = TestBed.inject(CommandService);
    registerTabContextMenu(
      registry,
      TestBed.inject(ContentTabsService),
      TestBed.inject(PaneMoveService),
      popout,
      DEFAULT_SHELL_FEATURES,
    );
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
      ]),
    );
    expect(
      registry.menuItems().filter((i) => i.menu === TAB_CONTEXT_MENU),
    ).toHaveLength(8);
  });

  it('close/others/right target the tab from the context', () => {
    commands.execute('shell.tab.close', { tabId: 't1' });
    commands.execute('shell.tab.closeOthers', { tabId: 't1' });
    commands.execute('shell.tab.closeRight', { tabId: 't1' });

    expect(tabs['close']).toHaveBeenCalledWith('t1');
    expect(tabs['closeOthers']).toHaveBeenCalledWith('t1');
    expect(tabs['closeToRight']).toHaveBeenCalledWith('t1');
  });

  it('closeAll clears the whole strip, whatever group the context names', () => {
    commands.execute('shell.tab.closeAll', { group: 'editor' });
    expect(tabs['closeAll']).toHaveBeenCalledWith();
  });

  it('togglePin pins an unpinned tab and unpins a pinned one', () => {
    commands.execute('shell.tab.togglePin', { tabId: 't1', pinned: false });
    expect(tabs['pin']).toHaveBeenCalledWith('t1');

    commands.execute('shell.tab.togglePin', { tabId: 't1', pinned: true });
    expect(tabs['unpin']).toHaveBeenCalledWith('t1');
  });

  it('split right/down move the context tab into a new group', () => {
    commands.execute('shell.tab.splitRight', { tabId: 'doc/a' });
    expect(paneMove['splitFromUrlGroup']).toHaveBeenCalledWith('doc/a', 'row');

    commands.execute('shell.tab.splitDown', { tabId: 'doc/a' });
    expect(paneMove['splitFromUrlGroup']).toHaveBeenCalledWith(
      'doc/a',
      'column',
    );
  });

  it('falls back to an empty tab id when the context is missing it', () => {
    commands.execute('shell.tab.close', {});
    expect(tabs['close']).toHaveBeenCalledWith('');
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
        { provide: PaneMoveService, useValue: paneMove },
      ],
    });
    const bed = TestBed.inject(ContributionRegistry);
    registerTabContextMenu(
      bed,
      TestBed.inject(ContentTabsService),
      TestBed.inject(PaneMoveService),
      popout,
      {
        ...DEFAULT_SHELL_FEATURES,
        content: {
          ...DEFAULT_SHELL_FEATURES.content,
          close: false,
          pin: false,
          splitDown: false,
        },
      },
    );
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
