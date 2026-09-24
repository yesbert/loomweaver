import {
  createEnvironmentInjector,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { chartColours } from './chart-tokens';

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

describe('chartColours', () => {
  const root = document.documentElement;

  afterEach(() => root.style.removeProperty('--lw-brand'));

  function colourScope() {
    const injector = createEnvironmentInjector(
      [],
      TestBed.inject(EnvironmentInjector),
    );
    const colours = runInInjectionContext(injector, () => chartColours());
    return { colours, injector };
  }

  it('follows a change of the page colours', async () => {
    const { colours, injector } = colourScope();

    root.style.setProperty('--lw-brand', 'rgb(1, 2, 3)');
    await settle();

    expect(colours().brand).toBe('rgb(1, 2, 3)');
    injector.destroy();
  });

  it('stops following the page once its view is gone', async () => {
    const { colours, injector } = colourScope();
    injector.destroy();

    root.style.setProperty('--lw-brand', 'rgb(1, 2, 3)');
    await settle();

    expect(colours().brand).toBe('');
  });
});
