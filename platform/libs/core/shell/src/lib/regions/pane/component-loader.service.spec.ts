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

  it('returns null for a source that declares neither form', () => {
    expect(loader.resolve({})).toBeNull();
  });
});
