import { ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { ContentReuseStrategy } from './content-reuse-strategy';
import type { Mock } from 'vitest';

function snap(
  path: string,
  {
    content = true,
    params = {},
    chromeless,
    retain = false,
  }: {
    content?: boolean;
    params?: Record<string, string>;
    chromeless?: boolean;
    retain?: boolean;
  } = {},
): ActivatedRouteSnapshot {
  return {
    routeConfig: { data: { content, chromeless, retain } },
    url: path.split('/').map((segment) => ({ path: segment })),
    params,
  } as unknown as ActivatedRouteSnapshot;
}

function handle(instance?: unknown): DetachedRouteHandle & {
  componentRef: { destroy: Mock };
} {
  return {
    componentRef: { destroy: vi.fn(), instance },
  } as unknown as DetachedRouteHandle & {
    componentRef: { destroy: Mock };
  };
}

function dirty(): unknown {
  return { surfaceDirty: () => true };
}

describe('ContentReuseStrategy', () => {
  it('detaches content routes but never a retained (stub-mounted) one — the stash owns those', () => {
    const strategy = new ContentReuseStrategy();
    expect(
      strategy.shouldDetach(snap('doc/abc', { params: { id: 'abc' } })),
    ).toBe(true);
    expect(strategy.shouldDetach(snap('notes', { retain: true }))).toBe(false);
    expect(strategy.shouldDetach(snap('other', { content: false }))).toBe(
      false,
    );
  });

  it('destroys a clean handle at store — the default', () => {
    const strategy = new ContentReuseStrategy();
    const route = snap('doc/abc', { params: { id: 'abc' } });
    expect(strategy.shouldDetach(route)).toBe(true);
    const h = handle();

    strategy.store(route, h);

    expect(h.componentRef.destroy).toHaveBeenCalledTimes(1);
    expect(strategy.shouldAttach(route)).toBe(false);
  });

  it('keeps a dirty handle alive', () => {
    const strategy = new ContentReuseStrategy();
    const route = snap('doc/abc', { params: { id: 'abc' } });
    const h = handle(dirty());

    strategy.store(route, h);

    expect(h.componentRef.destroy).not.toHaveBeenCalled();
    expect(strategy.shouldAttach(route)).toBe(true);
    expect(strategy.parkedHandles()).toEqual([
      expect.objectContaining({ key: 'doc/abc' }),
    ]);
  });

  it('never detaches the auth "sign-in required" placeholder twin', () => {
    const strategy = new ContentReuseStrategy();
    const placeholder = {
      routeConfig: { data: { content: true, authPlaceholder: true } },
      url: [{ path: 'secret' }],
      params: {},
    } as unknown as ActivatedRouteSnapshot;
    expect(strategy.shouldDetach(placeholder)).toBe(false);
  });

  it('keeps a parameterised route but never a chromeless one', () => {
    const strategy = new ContentReuseStrategy();
    expect(
      strategy.shouldDetach(snap('search/query', { params: { q: 'query' } })),
    ).toBe(true);
    expect(strategy.shouldDetach(snap('login', { chromeless: true }))).toBe(
      false,
    );
    expect(strategy.shouldDetach(snap('dashboard'))).toBe(true);
  });

  it('leaves non-content routes on the default reuse behaviour (same config reused)', () => {
    const strategy = new ContentReuseStrategy();
    const config = {};
    const a = {
      routeConfig: config,
      url: [],
      params: { id: '1' },
    } as unknown as ActivatedRouteSnapshot;
    const b = {
      routeConfig: config,
      url: [],
      params: { id: '2' },
    } as unknown as ActivatedRouteSnapshot;
    expect(strategy.shouldReuseRoute(a, b)).toBe(true);
  });

  it('stores and retrieves a dirty handle keyed by the concrete URL', () => {
    const strategy = new ContentReuseStrategy();
    const h = handle(dirty());

    strategy.store(snap('doc/abc'), h);

    expect(strategy.shouldAttach(snap('doc/abc'))).toBe(true);
    expect(strategy.retrieve(snap('doc/abc'))).toBe(h);
    expect(strategy.shouldAttach(snap('doc/xyz'))).toBe(false);
  });

  it('keeps the current instance only for the same config AND params', () => {
    const strategy = new ContentReuseStrategy();
    const routeConfig = { data: { content: true } };
    const mk = (params: Record<string, string>) =>
      ({ routeConfig, url: [], params }) as unknown as ActivatedRouteSnapshot;

    expect(
      strategy.shouldReuseRoute(mk({ id: 'abc' }), mk({ id: 'abc' })),
    ).toBe(true);
    expect(
      strategy.shouldReuseRoute(mk({ id: 'abc' }), mk({ id: 'xyz' })),
    ).toBe(false);
  });

  it('evict destroys the stored component and drops it', () => {
    const strategy = new ContentReuseStrategy();
    const h = handle(dirty());
    strategy.store(snap('doc/abc'), h);

    strategy.evict('doc/abc');

    expect(h.componentRef.destroy).toHaveBeenCalledTimes(1);
    expect(strategy.shouldAttach(snap('doc/abc'))).toBe(false);
  });

  it('evict tolerates a leading slash and an unknown path', () => {
    const strategy = new ContentReuseStrategy();
    const h = handle(dirty());
    strategy.store(snap('doc/abc'), h);

    expect(() => strategy.evict('nope')).not.toThrow();
    strategy.evict('/doc/abc');
    expect(h.componentRef.destroy).toHaveBeenCalledTimes(1);
  });

  it('pruneExcept destroys and drops handles no longer matching a live route', () => {
    const strategy = new ContentReuseStrategy();
    const kept = handle(dirty());
    const gone = handle(dirty());
    strategy.store(snap('doc/abc'), kept);
    strategy.store(snap('report/xyz'), gone);

    strategy.pruneExcept((key) => key.startsWith('doc/'));

    expect(gone.componentRef.destroy).toHaveBeenCalledTimes(1);
    expect(kept.componentRef.destroy).not.toHaveBeenCalled();
    expect(strategy.shouldAttach(snap('report/xyz'))).toBe(false);
    expect(strategy.shouldAttach(snap('doc/abc'))).toBe(true);
  });
});
