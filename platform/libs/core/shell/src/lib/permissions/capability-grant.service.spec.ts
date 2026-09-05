import { TestBed } from '@angular/core/testing';
import { SETTINGS_STORE } from '../persistence/settings-store';
import { KeyValueStore } from '../persistence/key-value-store';
import { CAPABILITY_GRANTS, provideCapabilityGrants } from './capability-grants';
import { CapabilityGrantService } from './capability-grant.service';

const KEY = 'lw.shell.capability-revocations';

function make(grants: Record<string, string[]>) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: CAPABILITY_GRANTS, useValue: grants }],
  });
  return TestBed.inject(CapabilityGrantService);
}

function makeWith(grants: Record<string, string[]>, store: KeyValueStore) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: CAPABILITY_GRANTS, useValue: grants },
      { provide: SETTINGS_STORE, useValue: store },
    ],
  });
  return TestBed.inject(CapabilityGrantService);
}

function makeDeclared(...declarations: Record<string, string[]>[]) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: declarations.map((grants) =>
      provideCapabilityGrants(grants as Parameters<typeof provideCapabilityGrants>[0]),
    ),
  });
  return TestBed.inject(CapabilityGrantService);
}

describe('CapabilityGrantService', () => {
  afterEach(() => localStorage.clear());

  it('composes grants declared in two places, one plugin each', () => {
    const service = makeDeclared({ first: ['contributions', 'ui'] }, { second: ['contributions', 'navigation'] });
    service.register('first', ['contributions', 'ui']);
    service.register('second', ['contributions', 'navigation']);

    expect(service.isGranted('first', 'ui')).toBe(true);
    expect(service.isGranted('second', 'navigation')).toBe(true);
  });

  it('composes two declarations for the same plugin into their union', () => {
    const service = makeDeclared({ p: ['contributions'] }, { p: ['ui'] });
    service.register('p', ['contributions', 'ui', 'navigation']);

    expect(service.isGranted('p', 'contributions')).toBe(true);
    expect(service.isGranted('p', 'ui')).toBe(true);
    expect(service.isGranted('p', 'navigation')).toBe(false);
  });

  it('a single declaration means what it always meant', () => {
    const service = makeDeclared({ p: ['contributions', 'ui'] });
    service.register('p', ['contributions', 'ui', 'host']);

    expect(service.isGranted('p', 'ui')).toBe(true);
    expect(service.isGranted('p', 'host')).toBe(false);
  });

  it('hydrates revocations from a peek-less store and survives one that rejects', async () => {
    const hydrated = makeWith(
      { p: ['contributions', 'ui'] },
      {
        get: () => Promise.resolve(JSON.stringify(['p:ui'])),
        set: () => Promise.resolve(),
        delete: () => Promise.resolve(),
      },
    );
    hydrated.register('p', ['contributions', 'ui']);
    await Promise.resolve();
    await Promise.resolve();
    expect(hydrated.isGranted('p', 'ui')).toBe(false);

    const service = makeWith(
      { p: ['contributions', 'ui'] },
      {
        get: () => Promise.reject(new Error('401')),
        set: () => Promise.resolve(),
        delete: () => Promise.resolve(),
      },
    );
    service.register('p', ['contributions', 'ui']);
    await Promise.resolve();
    await Promise.resolve();

    expect(service.isGranted('p', 'ui')).toBe(true);
  });

  it('a granted override replaces the composition grant — the install-consent source', () => {
    const service = make({});
    service.register(
      'installed',
      ['contributions', 'ui'],
      ['contributions', 'ui'],
    );

    expect(service.isGranted('installed', 'contributions')).toBe(true);
    expect(service.isGranted('installed', 'ui')).toBe(true);
    expect(service.isGranted('installed', 'navigation')).toBe(false);
  });

  it('grants the base = grant ∩ declaration and denies everything else (default-deny)', () => {
    const service = make({ p: ['contributions', 'ui', 'navigation'] });
    service.register('p', ['contributions', 'ui']);

    expect(service.isGranted('p', 'contributions')).toBe(true);
    expect(service.isGranted('p', 'ui')).toBe(true);
    expect(service.isGranted('p', 'navigation')).toBe(false);
    expect(service.isGranted('p', 'host')).toBe(false);
    expect(service.isGranted('unknown', 'ui')).toBe(false);
  });

  it('revoking a granted capability takes effect immediately and restoring turns it back on', () => {
    const service = make({ p: ['ui'] });
    service.register('p', ['ui']);
    expect(service.isGranted('p', 'ui')).toBe(true);

    service.setGranted('p', 'ui', false);
    expect(service.isGranted('p', 'ui')).toBe(false);

    service.setGranted('p', 'ui', true);
    expect(service.isGranted('p', 'ui')).toBe(true);
  });

  it('isBaseGranted ignores revocations so activation is never blocked by them', () => {
    const service = make({ p: ['ui'] });
    service.register('p', ['ui']);
    service.setGranted('p', 'ui', false);

    expect(service.isGranted('p', 'ui')).toBe(false);
    expect(service.isBaseGranted('p', 'ui')).toBe(true);
    expect(service.isBaseGranted('p', 'host')).toBe(false);
  });

  it('persists revocations through the settings store', () => {
    const service = make({ p: ['ui'] });
    service.register('p', ['ui']);

    service.setGranted('p', 'ui', false);

    expect(JSON.parse(localStorage.getItem(KEY) ?? '[]')).toEqual(['p:ui']);
  });

  it('re-applies a persisted revocation on construction', () => {
    localStorage.setItem(KEY, JSON.stringify(['p:ui']));
    const service = make({ p: ['ui', 'contributions'] });
    service.register('p', ['ui', 'contributions']);

    expect(service.isGranted('p', 'ui')).toBe(false);
    expect(service.isGranted('p', 'contributions')).toBe(true);
  });

  it('drops a persisted revocation for a non-revocable capability (a stale contributions key)', () => {
    localStorage.setItem(KEY, JSON.stringify(['p:contributions', 'p:ui']));
    const service = make({ p: ['contributions', 'ui'] });
    service.register('p', ['contributions', 'ui']);

    expect(service.isGranted('p', 'contributions')).toBe(true);
    expect(service.isGranted('p', 'ui')).toBe(false);
  });

  it('lists the revocable capabilities (never `contributions`), sorted by plugin id', () => {
    const service = make({ b: ['ui', 'contributions'], a: ['host'] });
    service.register('b', ['ui', 'contributions']);
    service.register('a', ['host']);

    const view = service.permissions();
    expect(view.map((p) => p.pluginId)).toEqual(['a', 'b']);
    expect(view[1].capabilities.map((c) => c.capability)).toEqual(['ui']);
    expect(view[0].capabilities.map((c) => c.capability)).toEqual(['host']);
  });

  it('reflects a revocation in the permissions view and unregister drops the plugin', () => {
    const service = make({ p: ['ui'] });
    service.register('p', ['ui']);
    service.setGranted('p', 'ui', false);
    expect(service.permissions()[0].capabilities[0].effective).toBe(false);

    service.unregister('p');
    expect(service.permissions()).toHaveLength(0);
  });
});
