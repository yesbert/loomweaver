import { TestBed } from '@angular/core/testing';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { CommandService } from '../../commands/command.service';
import {
  VIEW_CONTEXT_MENU,
  registerViewContextMenu,
  registerViewOpenInContentMenu,
  registerViewResetMenu,
  registerViewStackMenu,
} from './view-context-menu';
import { ViewMoveService } from './view-move.service';
import { ViewStateService } from '../../views/view-state.service';
import { ViewInstanceService } from '../../views/view-instance.service';
import { CONTENT_DOCK } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { PRIMARY_PANE, VIEW_PANE_PREFIX } from '../pane/tree/pane-address';
import type { Mock } from 'vitest';

describe('registerViewContextMenu', () => {
  let registry: ContributionRegistry;
  let commands: CommandService;
  let move: Mock;
  let otherPanel: Mock;

  beforeEach(() => {
    move = vi.fn();
    otherPanel = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: ViewMoveService, useValue: { move, otherPanel } }],
    });
    registry = TestBed.inject(ContributionRegistry);
    commands = TestBed.inject(CommandService);
    registerViewContextMenu(registry, TestBed.inject(ViewMoveService));
  });

  it('contributes a move item to the view-context slot', () => {
    const items = registry
      .menuItems()
      .filter((item) => item.menu === VIEW_CONTEXT_MENU);
    expect(items).toEqual([
      {
        id: 'menu:shell.view.moveToOtherSidebar',
        menu: VIEW_CONTEXT_MENU,
        command: 'shell.view.moveToOtherSidebar',
        group: '1_move',
        order: 0,
      },
    ]);
  });

  it('moves the target view into the opposite-dock panel', () => {
    otherPanel.mockReturnValue('secondary');
    commands.execute('shell.view.moveToOtherSidebar', {
      viewId: 'v1',
      region: 'primary',
    });
    expect(otherPanel).toHaveBeenCalledWith('primary');
    expect(move).toHaveBeenCalledWith('v1', 'secondary');
  });

  it('is a no-op when there is no other panel to move into', () => {
    otherPanel.mockReturnValue(undefined);
    commands.execute('shell.view.moveToOtherSidebar', {
      viewId: 'v1',
      region: 'primary',
    });
    expect(move).not.toHaveBeenCalled();
  });
});

describe('registerViewResetMenu', () => {
  let commands: CommandService;
  let reset: Mock;

  beforeEach(() => {
    localStorage.clear();
    reset = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: ViewStateService, useValue: { reset } }],
    });
    const registry = TestBed.inject(ContributionRegistry);
    commands = TestBed.inject(CommandService);
    registerViewResetMenu(
      registry,
      TestBed.inject(ViewStateService),
      TestBed.inject(ViewInstanceService),
    );
  });

  it('resets the tab-stamped instance when the context carries one', () => {
    commands.execute('shell.view.resetState', {
      viewId: 'v1',
      region: 'primary',
      instance: 'leaf-7',
    });
    expect(reset).toHaveBeenCalledWith('leaf-7');
  });

  it('falls back to the named active instance for unstamped tabs', () => {
    TestBed.inject(ViewInstanceService).create('v1', 'Alpha');
    const activeId = TestBed.inject(ViewInstanceService).activeId('v1')();
    commands.execute('shell.view.resetState', {
      viewId: 'v1',
      region: 'primary',
    });
    expect(reset).toHaveBeenCalledWith(activeId);
  });

  it('is a no-op without a view id', () => {
    commands.execute('shell.view.resetState', { region: 'primary' });
    expect(reset).not.toHaveBeenCalled();
  });
});

describe('registerViewStackMenu', () => {
  let commands: CommandService;
  let paneTree: { setActiveTab: Mock; stackView: Mock; primaryId: Mock };

  beforeEach(() => {
    paneTree = {
      setActiveTab: vi.fn(),
      stackView: vi.fn(),
      primaryId: vi.fn().mockReturnValue('main'),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: PaneTreeService, useValue: paneTree }],
    });
    registerViewStackMenu(
      TestBed.inject(ContributionRegistry),
      TestBed.inject(PaneTreeService),
    );
    commands = TestBed.inject(CommandService);
  });

  it('contributes a stack item to the view-context slot', () => {
    expect(
      TestBed.inject(ContributionRegistry)
        .menuItems()
        .some((i) => i.id === 'menu:shell.view.stackBelow'),
    ).toBe(true);
  });

  it('activates the view and stacks it below in its region', () => {
    commands.execute('shell.view.stackBelow', {
      viewId: 'v1',
      region: 'primary',
    });
    expect(paneTree.setActiveTab).toHaveBeenCalledWith(
      'primary',
      PRIMARY_PANE,
      VIEW_PANE_PREFIX + 'v1',
    );
    expect(paneTree.stackView).toHaveBeenCalledWith('primary', 'v1');
  });

  it('is a no-op without both view id and region', () => {
    commands.execute('shell.view.stackBelow', { viewId: 'v1' });
    expect(paneTree.stackView).not.toHaveBeenCalled();
  });
});

describe('registerViewOpenInContentMenu', () => {
  let commands: CommandService;
  let paneTree: { splitPane: Mock; primaryId: Mock };

  beforeEach(() => {
    paneTree = {
      splitPane: vi.fn(),
      primaryId: vi.fn().mockReturnValue('main'),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: PaneTreeService, useValue: paneTree }],
    });
    registerViewOpenInContentMenu(
      TestBed.inject(ContributionRegistry),
      TestBed.inject(PaneTreeService),
    );
    commands = TestBed.inject(CommandService);
  });

  it('opens the view as a content split', () => {
    commands.execute('shell.view.openInContent', {
      viewId: 'v1',
      region: 'primary',
    });
    expect(paneTree.splitPane).toHaveBeenCalledWith(
      CONTENT_DOCK,
      PRIMARY_PANE,
      'row',
      VIEW_PANE_PREFIX + 'v1',
    );
  });

  it('is a no-op without a view id', () => {
    commands.execute('shell.view.openInContent', { region: 'primary' });
    expect(paneTree.splitPane).not.toHaveBeenCalled();
  });
});
