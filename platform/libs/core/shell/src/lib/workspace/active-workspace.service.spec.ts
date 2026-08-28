import { TestBed } from '@angular/core/testing';
import {
  ActiveWorkspaceService,
  DEFAULT_WORKSPACE_ID,
} from './active-workspace.service';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { provideWorkspaces } from './provide-workspaces';

const KEY = 'lw.shell.active-workspace';

describe('ActiveWorkspaceService', () => {
  beforeEach(() => localStorage.clear());

  it('starts in the default workspace when nothing is stored', async () => {
    const active = TestBed.inject(ActiveWorkspaceService);
    expect(active.id()).toBe(DEFAULT_WORKSPACE_ID);
    await expect(active.ready).resolves.toBe(DEFAULT_WORKSPACE_ID);
  });

  it('restores the stored id synchronously via peek', () => {
    localStorage.setItem(KEY, 'ws-1');
    expect(TestBed.inject(ActiveWorkspaceService).id()).toBe('ws-1');
  });

  it('persists a switch and scopes keys to the active workspace', () => {
    const active = TestBed.inject(ActiveWorkspaceService);
    expect(active.scopedKey('lw.shell.pane-trees')).toBe(
      `lw.shell.pane-trees:${DEFAULT_WORKSPACE_ID}`,
    );

    active.set('ws-2');

    expect(active.id()).toBe('ws-2');
    expect(localStorage.getItem(KEY)).toBe('ws-2');
    expect(active.scopedKey('lw.shell.pane-trees')).toBe(
      'lw.shell.pane-trees:ws-2',
    );
  });

  it('settles the stored id for a peek-less store before layout hydration', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WORKING_STATE_STORE,
          useValue: {
            get: (key: string) =>
              Promise.resolve(key === KEY ? 'ws-remote' : undefined),
            set: () => Promise.resolve(),
            delete: () => Promise.resolve(),
          },
        },
      ],
    });
    const active = TestBed.inject(ActiveWorkspaceService);
    expect(active.id()).toBe(DEFAULT_WORKSPACE_ID);

    await expect(active.ready).resolves.toBe('ws-remote');
    expect(active.id()).toBe('ws-remote');
  });

  it('falls back to the default id when the peek-less read rejects', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WORKING_STATE_STORE,
          useValue: {
            get: () => Promise.reject(new Error('401')),
            set: () => Promise.resolve(),
            delete: () => Promise.resolve(),
          },
        },
      ],
    });
    const active = TestBed.inject(ActiveWorkspaceService);
    await expect(active.ready).resolves.toBe(DEFAULT_WORKSPACE_ID);
  });

  it('opens a first boot in the declared initial workspace and remembers the choice', () => {
    TestBed.configureTestingModule({
      providers: [
        provideWorkspaces(
          { id: 'plain', title: 'Plain' },
          { id: 'research', title: 'Research', initial: true },
        ),
      ],
    });
    const active = TestBed.inject(ActiveWorkspaceService);

    expect(active.id()).toBe('research');
    expect(localStorage.getItem(KEY)).toBe('research');
  });

  it('leaves a returning user where they were, even against a declared initial', () => {
    localStorage.setItem(KEY, DEFAULT_WORKSPACE_ID);
    TestBed.configureTestingModule({
      providers: [
        provideWorkspaces({ id: 'research', title: 'R', initial: true }),
      ],
    });

    expect(TestBed.inject(ActiveWorkspaceService).id()).toBe(
      DEFAULT_WORKSPACE_ID,
    );
  });

  it('takes the first declaration when two claim to be initial', () => {
    TestBed.configureTestingModule({
      providers: [
        provideWorkspaces(
          { id: 'first', title: 'F', initial: true },
          { id: 'second', title: 'S', initial: true },
        ),
      ],
    });

    expect(TestBed.inject(ActiveWorkspaceService).id()).toBe('first');
  });

  it('adopts through a peek-less store too, and reports the adoption once', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WORKING_STATE_STORE,
          useValue: {
            get: () => Promise.resolve(undefined),
            set: () => Promise.resolve(),
            delete: () => Promise.resolve(),
          },
        },
        provideWorkspaces({ id: 'research', title: 'R', initial: true }),
      ],
    });
    const active = TestBed.inject(ActiveWorkspaceService);

    await expect(active.ready).resolves.toBe('research');
    expect(active.takeAdoption()).toBe('research');
    expect(active.takeAdoption()).toBeNull();
  });
});
