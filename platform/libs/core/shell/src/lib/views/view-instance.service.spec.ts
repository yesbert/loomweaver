import { TestBed } from '@angular/core/testing';
import { ViewInstanceService } from './view-instance.service';
import { KeyValueStore } from '../persistence/key-value-store';
import { provideWorkingStateStore } from '../persistence/working-state-store';

const KEY = 'lw.shell.view-instances:v';

describe('ViewInstanceService', () => {
  beforeEach(() => localStorage.clear());

  it('seeds a single non-deletable default instance (id === viewId)', () => {
    const service = TestBed.inject(ViewInstanceService);
    expect(service.instances('v')()).toEqual([{ id: 'v', name: '' }]);
    expect(service.activeId('v')()).toBe('v');
    expect(service.isDefault('v', 'v')).toBe(true);
  });

  it('returns a stable derived signal per view id (no per-call computed)', () => {
    const service = TestBed.inject(ViewInstanceService);
    expect(service.instances('v')).toBe(service.instances('v'));
    expect(service.activeId('v')).toBe(service.activeId('v'));

    const active = service.activeId('v');
    service.create('v', 'Alpha');
    expect(active()).not.toBe('v');
  });

  it('creates a named instance, makes it active, and persists', () => {
    const service = TestBed.inject(ViewInstanceService);
    service.create('v', 'Alpha');

    const instances = service.instances('v')();
    expect(instances).toHaveLength(2);
    const created = instances.find((index) => index.name === 'Alpha');
    expect(created).toBeDefined();
    expect(service.activeId('v')()).toBe(created?.id);
    expect(service.isDefault('v', created?.id ?? '')).toBe(false);
    expect(localStorage.getItem(KEY)).toContain('Alpha');
  });

  it('renames a non-default instance but ignores the default', () => {
    const service = TestBed.inject(ViewInstanceService);
    service.create('v', 'Alpha');
    const id = service.activeId('v')();

    service.rename('v', id, 'Beta');
    expect(
      service
        .instances('v')()
        .find((index) => index.id === id)?.name,
    ).toBe('Beta');

    service.rename('v', 'v', 'Renamed default');
    expect(
      service
        .instances('v')()
        .find((index) => index.id === 'v')?.name,
    ).toBe('');
  });

  it('deletes a non-default instance, clears its state, and falls back to the default', () => {
    const service = TestBed.inject(ViewInstanceService);
    service.create('v', 'Alpha');
    const id = service.activeId('v')();
    localStorage.setItem(`lw.shell.view-state:${id}`, JSON.stringify({ x: 1 }));

    service.remove('v', id);
    expect(service.instances('v')()).toEqual([{ id: 'v', name: '' }]);
    expect(service.activeId('v')()).toBe('v');
    expect(localStorage.getItem(`lw.shell.view-state:${id}`)).toBeNull();
  });

  it('protects the default from deletion', () => {
    const service = TestBed.inject(ViewInstanceService);
    service.remove('v', 'v');
    expect(service.instances('v')()).toEqual([{ id: 'v', name: '' }]);
  });

  it('switches the active instance', () => {
    const service = TestBed.inject(ViewInstanceService);
    service.create('v', 'Alpha');
    const alpha = service.activeId('v')();
    service.setActive('v', 'v');
    expect(service.activeId('v')()).toBe('v');
    service.setActive('v', alpha);
    expect(service.activeId('v')()).toBe(alpha);
  });

  it('restores a persisted record synchronously via peek', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        instances: [
          { id: 'v', name: '' },
          { id: 'x', name: 'Saved' },
        ],
        activeId: 'x',
      }),
    );
    const service = TestBed.inject(ViewInstanceService);
    expect(service.instances('v')()).toHaveLength(2);
    expect(service.activeId('v')()).toBe('x');
  });

  it('hydrates asynchronously when the store has no peek', async () => {
    const asyncStore: KeyValueStore = {
      get: (key) =>
        Promise.resolve(
          key === KEY
            ? JSON.stringify({
                instances: [
                  { id: 'v', name: '' },
                  { id: 'x', name: 'Saved' },
                ],
                activeId: 'x',
              })
            : undefined,
        ),
      set: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    };
    TestBed.configureTestingModule({
      providers: [provideWorkingStateStore(asyncStore)],
    });

    const service = TestBed.inject(ViewInstanceService);
    expect(service.activeId('v')()).toBe('v');
    await Promise.resolve();
    expect(service.activeId('v')()).toBe('x');
  });
});
