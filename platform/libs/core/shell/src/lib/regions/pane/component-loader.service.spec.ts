import { Component, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ComponentLoader } from './component-loader.service';

@Component({ selector: 'lw-test-lazy', template: '' })
class TestLazy {}

describe('ComponentLoader', () => {
  let loader: ComponentLoader;

  beforeEach(() => {
    loader = TestBed.inject(ComponentLoader);
  });

  it('returns an eager component as-is', () => {
    expect(loader.resolve({ component: TestLazy })).toBe(TestLazy);
  });

  it('returns null until a deferred component resolves, then the component', async () => {
    const source = { loadComponent: () => Promise.resolve<Type<unknown>>(TestLazy) };

    expect(loader.resolve(source)).toBeNull();
    await Promise.resolve();

    expect(loader.resolve(source)).toBe(TestLazy);
  });

  it('calls one loader once, however often the surface is mounted', async () => {
    let calls = 0;
    const source = {
      loadComponent: () => {
        calls += 1;
        return Promise.resolve<Type<unknown>>(TestLazy);
      },
    };

    loader.resolve(source);
    loader.resolve(source);
    await Promise.resolve();
    loader.resolve(source);

    expect(calls).toBe(1);
  });

  it('says so once a deferred component has failed to load, and not before', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const source = {
      loadComponent: () => Promise.reject<Type<unknown>>(new Error('chunk gone')),
    };

    expect(loader.resolve(source)).toBeNull();
    expect(loader.failed(source)).toBe(false);
    await Promise.resolve();
    await Promise.resolve();

    expect(loader.resolve(source)).toBeNull();
    expect(loader.failed(source)).toBe(true);
    expect(loader.failed({ component: TestLazy })).toBe(false);
    logged.mockRestore();
  });

  it('tries a failed load again when asked, and leaves a load that has not failed alone', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let calls = 0;
    const source = {
      loadComponent: () => {
        calls += 1;
        return calls === 1
          ? Promise.reject<Type<unknown>>(new Error('chunk gone'))
          : Promise.resolve<Type<unknown>>(TestLazy);
      },
    };

    loader.resolve(source);
    loader.retry(source);
    expect(calls).toBe(1);
    await Promise.resolve();
    await Promise.resolve();
    expect(loader.failed(source)).toBe(true);

    loader.retry(source);
    expect(loader.failed(source)).toBe(false);
    await Promise.resolve();

    expect(calls).toBe(2);
    expect(loader.resolve(source)).toBe(TestLazy);
    loader.retry(source);
    expect(calls).toBe(2);
    logged.mockRestore();
  });

  it('returns null for a source that declares neither form', () => {
    expect(loader.resolve({})).toBeNull();
  });
});
