import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { MenuListEntry, MenuService } from '../../../menu/menu.service';
import { MoveAnnouncer } from '../../reorder/move-announcer';
import { PaneTreeService } from '../tree/pane-tree.service';
import { leafOf } from '../tree/pane-node';
import { PaneFocus } from '../pane-focus';
import { PaneMoveService } from './pane-move.service';
import { TabMoves } from './tab-moves';

const ADDRESS = { dock: 'content', paneId: 'main' };
const SIDE = { dock: 'content', paneId: 'p2' };

describe('TabMoves', () => {
  let paneMove: {
    moveToStrip: ReturnType<typeof vi.fn>;
    splitTabOut: ReturnType<typeof vi.fn>;
  };
  let announceTab: ReturnType<typeof vi.fn>;
  let settleOnTab: ReturnType<typeof vi.fn>;
  let openList: ReturnType<typeof vi.fn>;
  let moves: TabMoves;

  beforeEach(() => {
    paneMove = {
      moveToStrip: vi.fn(() => Promise.resolve(true)),
      splitTabOut: vi.fn(() => Promise.resolve(true)),
    };
    announceTab = vi.fn();
    settleOnTab = vi.fn();
    openList = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: PaneMoveService, useValue: paneMove },
        { provide: MoveAnnouncer, useValue: { announceTab } },
        { provide: PaneFocus, useValue: { settleOnTab } },
        { provide: MenuService, useValue: { openList } },
        {
          provide: TranslocoService,
          useValue: {
            translate: (key: string, params?: Record<string, unknown>) =>
              params ? `${key} ${JSON.stringify(params)}` : key,
          },
        },
        {
          provide: PaneTreeService,
          useValue: {
            tree: () => ({
              kind: 'split',
              id: 's',
              orientation: 'row',
              ratio: 0.5,
              first: leafOf('main', 'doc/a'),
              second: leafOf('p2', 'doc/b'),
            }),
            primaryId: () => 'main',
          },
        },
      ],
    });
    moves = TestBed.inject(TabMoves);
  });

  function offered(): { entries: MenuListEntry[]; pick: (key: string) => void } {
    const [entries, , pick] = openList.mock.calls[0] as [
      MenuListEntry[],
      unknown,
      (key: string) => void,
    ];
    return { entries, pick };
  }

  it('offers the other panes of the main area by their place and what they show', () => {
    moves.pickTarget('doc/a', ADDRESS);

    const { entries } = offered();
    expect(entries.map((entry) => entry.key)).toEqual(['p2']);
    const label = entries[0].label as (translate: (key: string) => string) => string;
    expect(label((key) => key)).toBe(
      'content.tabMove.pane {"position":2,"title":"doc/b"}',
    );
  });

  it('moves the tab into the pane picked, announces where it went and lets the focus follow it', async () => {
    moves.pickTarget('doc/a', ADDRESS);
    offered().pick('p2');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(paneMove.moveToStrip).toHaveBeenCalledWith(ADDRESS, 'doc/a', SIDE);
    expect(announceTab).toHaveBeenCalledWith(
      'content.tabMove.announce',
      { id: 'doc/a', title: 'doc/a', literalTitle: true },
      { position: 2 },
    );
    expect(settleOnTab).toHaveBeenCalledWith('doc/a', SIDE);
  });

  it('says nothing and leaves the focus where a move did not happen', async () => {
    paneMove.moveToStrip.mockReturnValue(Promise.resolve(false));
    moves.pickTarget('doc/a', ADDRESS);
    offered().pick('p2');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(announceTab).not.toHaveBeenCalled();
    expect(settleOnTab).not.toHaveBeenCalled();
  });

  it('announces a tab split out into a new pane and lets the focus follow it', async () => {
    await moves.splitOut('doc/b', 'row', SIDE);

    expect(paneMove.splitTabOut).toHaveBeenCalledWith('doc/b', 'row', SIDE);
    expect(announceTab).toHaveBeenCalledWith('content.tabMove.announceNew', {
      id: 'doc/b',
      title: 'doc/b',
      literalTitle: true,
    });
    expect(settleOnTab).toHaveBeenCalledWith('doc/b', SIDE);
  });

  it('says nothing about a split that did not happen', async () => {
    paneMove.splitTabOut.mockReturnValue(Promise.resolve(false));

    await moves.splitOut('doc/a', 'column');

    expect(paneMove.splitTabOut).toHaveBeenCalledWith(
      'doc/a',
      'column',
      undefined,
    );
    expect(announceTab).not.toHaveBeenCalled();
    expect(settleOnTab).not.toHaveBeenCalled();
  });
});
