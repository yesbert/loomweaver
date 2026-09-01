import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLayout } from '../layout/layout';
import { WorkspaceService } from './workspace.service';
import { provideWorkspaces } from './provide-workspaces';

const LAYOUT = {
  regions: [
    { id: 'main', type: 'content', dock: 'center' },
    { id: 'left-panel', type: 'panel', dock: 'left' },
  ],
} as const;

function compose(): WorkspaceService {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideLayout(LAYOUT as never),
      provideWorkspaces(
        { id: 'overview', title: 'Overview', claims: [''] },
        {
          id: 'quotes',
          title: 'Quotes',
          claims: ['quotes/:id'],
          sidebars: { 'left-panel': [] },
        },
        { id: 'orders', title: 'Orders' },
      ),
    ],
  });
  return TestBed.inject(WorkspaceService);
}

describe('settling an address in the workspace that claims it', () => {
  beforeEach(() => localStorage.clear());

  it('takes the user to the workspace that claims the address', async () => {
    const ws = compose();
    await ws.switchTo('orders');

    await ws.settle('quotes/q-0007');

    expect(ws.activeId()).toBe('quotes');
  });

  it('leaves the user alone where the active workspace claims the address itself', async () => {
    const ws = compose();
    await ws.switchTo('quotes');

    await ws.settle('quotes/q-0007');

    expect(ws.activeId()).toBe('quotes');
  });

  it('leaves the user alone where nothing claims the address', async () => {
    const ws = compose();
    await ws.switchTo('orders');

    await ws.settle('payments');

    expect(ws.activeId()).toBe('orders');
  });

  it('keeps a variant of the claiming workspace rather than moving out of it', async () => {
    const ws = compose();
    await ws.switchTo('quotes');
    await ws.saveCurrent('Month end');
    const variant = ws.workspaces()[0];

    await ws.settle('quotes/q-0007');

    expect(ws.activeId()).toBe(variant.id);
    expect(ws.originOf(variant.id)).toBe('quotes');
  });

  it('makes a variant of a variant belong to the same declared workspace', async () => {
    const ws = compose();
    await ws.switchTo('quotes');
    await ws.saveCurrent('Month end');
    await ws.saveCurrent('Month end, wider');

    const [first, second] = ws.workspaces();
    expect(ws.originOf(second.id)).toBe(ws.originOf(first.id));
    expect(ws.originOf(second.id)).toBe('quotes');
  });

  it('gives a variant no origin where it was saved from a workspace the product never declared', async () => {
    const ws = compose();
    await ws.saveCurrent('Mine');
    const variant = ws.workspaces()[0];

    expect(ws.originOf(variant.id)).toBeNull();
    expect(ws.claimsOfWorkspace(variant.id)).toEqual([]);
  });

  it('never makes a variant the destination of an address', async () => {
    const ws = compose();
    await ws.switchTo('quotes');
    await ws.saveCurrent('Month end');
    await ws.switchTo('orders');

    await ws.settle('quotes/q-0007');

    expect(ws.activeId()).toBe('quotes');
  });

  it('moves nobody where a product declares no claims at all', async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideLayout(LAYOUT as never),
        provideWorkspaces(
          { id: 'overview', title: 'Overview' },
          { id: 'quotes', title: 'Quotes' },
        ),
      ],
    });
    const ws = TestBed.inject(WorkspaceService);
    await ws.switchTo('overview');

    await ws.settle('quotes/q-0007');
    await ws.settle('');

    expect(ws.activeId()).toBe('overview');
  });

  it('lets a claimed address beat the workspace a first visit was declared to start in', async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideLayout(LAYOUT as never),
        provideWorkspaces(
          { id: 'overview', title: 'Overview', initial: true },
          { id: 'quotes', title: 'Quotes', claims: ['quotes/:id'] },
        ),
      ],
    });
    const ws = TestBed.inject(WorkspaceService);
    expect(ws.activeId()).toBe('overview');

    await ws.settle('quotes/q-0007');

    expect(ws.activeId()).toBe('quotes');
  });

  it('claims the address that names nothing where a workspace asked for it', async () => {
    const ws = compose();
    await ws.switchTo('quotes');
    await ws.settle('quotes/q-0007');

    await ws.settle('');

    expect(ws.activeId()).toBe('overview');
  });

  it('does not hand the user on where the address only follows the workspace they chose', async () => {
    const ws = compose();

    await ws.switchTo('quotes');
    await ws.settle('');

    expect(ws.activeId()).toBe('quotes');
  });

  it('settles an address the user asks for after the workspace they chose', async () => {
    const ws = compose();

    await ws.switchTo('quotes');
    await ws.settle('');
    await ws.settle('');

    expect(ws.activeId()).toBe('overview');
  });
});
