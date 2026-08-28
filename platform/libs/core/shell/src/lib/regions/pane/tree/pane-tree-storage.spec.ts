import { TestBed } from '@angular/core/testing';
import { CONTENT_DOCK, PRIMARY_PANE } from './pane-address';
import { PaneLeaf, leafOf } from './pane-node';
import { PaneTreeService } from './pane-tree.service';
import { PaneContainersService } from '../container/pane-containers.service';
import { containerDockFor } from '../container/container-children';
import { WORKING_STATE_STORE } from '../../../persistence/working-state-store';
import {
  ActiveWorkspaceService,
} from '../../../workspace/active-workspace.service';

const ACTIVE_KEY = 'lw.shell.active-workspace';

describe('PaneTreeService — network working-state store (no peek, LWF-02b)', () => {
  afterEach(() => vi.useRealTimers());

  async function setup(get: () => Promise<string | undefined>) {
    const set = vi.fn(() => Promise.resolve());
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WORKING_STATE_STORE,
          useValue: {
            get: (key: string) =>
              key === ACTIVE_KEY ? Promise.resolve(undefined) : get(),
            set,
          },
        },
      ],
    });
    const paneTree = TestBed.inject(PaneTreeService);
    await TestBed.inject(ActiveWorkspaceService).ready;
    return { paneTree, set };
  }

  const hydratedTree = JSON.stringify({
    [CONTENT_DOCK]: {
      kind: 'split',
      id: 'root',
      orientation: 'row',
      ratio: 0.5,
      first: { kind: 'leaf', id: PRIMARY_PANE, tabs: [] },
      second: leafOf('secondary', 'search'),
    },
  });

  it('does not persist a boot write before the async load resolves', async () => {
    const { paneTree, set } = await setup(() => new Promise(() => undefined));
    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    expect(set).not.toHaveBeenCalled();
  });

  it('persists once the async load has resolved', async () => {
    let resolve!: (raw: string | undefined) => void;
    const { paneTree, set } = await setup(
      () => new Promise((r) => (resolve = r)),
    );
    resolve(undefined);
    await Promise.resolve();

    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    expect(set).toHaveBeenCalled();
  });

  it('never persists when the load fails — a rejection must not overwrite the server tree', async () => {
    const { paneTree, set } = await setup(() =>
      Promise.reject(new Error('offline')),
    );
    await Promise.resolve();
    await Promise.resolve();

    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    expect(set).not.toHaveBeenCalled();
  });

  it('applies the loaded tree once the async load resolves', async () => {
    let resolve!: (raw: string | undefined) => void;
    const { paneTree } = await setup(() => new Promise((r) => (resolve = r)));
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);

    resolve(hydratedTree);
    await Promise.resolve();

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
  });

  it('retries once after a transient load failure, then applies the tree and resumes persistence', async () => {
    vi.useFakeTimers();
    let attempt = 0;
    const set = vi.fn(() => Promise.resolve());
    const paneGet = vi.fn(() =>
      attempt++ === 0
        ? Promise.reject(new Error('transient'))
        : Promise.resolve(hydratedTree),
    );
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WORKING_STATE_STORE,
          useValue: {
            get: (key: string) =>
              key === ACTIVE_KEY ? Promise.resolve(undefined) : paneGet(),
            set,
          },
        },
      ],
    });
    const paneTree = TestBed.inject(PaneTreeService);
    await TestBed.inject(ActiveWorkspaceService).ready;

    await Promise.resolve();
    await Promise.resolve();
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);

    vi.advanceTimersByTime(500);
    await Promise.resolve();
    await Promise.resolve();

    expect(paneGet).toHaveBeenCalledTimes(2);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);

    paneTree.unsplit(CONTENT_DOCK);
    expect(set).toHaveBeenCalled();
  });

  it('preserves a freshly-seeded container dock when the async load resolves empty (LWF-03)', async () => {
    let resolve!: (raw: string | undefined) => void;
    const { paneTree } = await setup(() => new Promise((r) => (resolve = r)));
    const containers = TestBed.inject(PaneContainersService);
    const dock = containerDockFor('runs/1');
    containers.ensureContainer(dock, {
      children: ['runs.cockpit'],
      initial: ['runs.cockpit'],
    });
    expect(paneTree.tree(dock).kind).toBe('leaf');

    resolve(undefined);
    await Promise.resolve();

    const leaf = paneTree.tree(dock) as PaneLeaf;
    expect(leaf.tabs.map((tab) => tab.path)).toEqual(['view:runs.cockpit']);
  });
});
