import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { BootAddress } from './boot-address';
import { buildContentRoutes } from './content-router';
import { keepPopout } from './keep-popout.guard';

function decide(bootPath: string, url: string): boolean {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: BootAddress, useValue: { path: bootPath } }],
  });
  return runInInjectionContext(TestBed.inject(Injector), () =>
    keepPopout({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
  ) as boolean;
}

describe('a pop-out window cannot stop being one', () => {
  it('guards every content address, placeholders included', () => {
    const routes = buildContentRoutes(
      [
        { path: '', pluginId: 'p', component: class {} } as never,
        {
          path: 'gated',
          pluginId: 'p',
          component: class {},
          access: { authenticated: true },
        } as never,
      ],
      [{ path: 'gone', component: class {} } as never],
    );

    expect(routes).toHaveLength(4);
    for (const route of routes) {
      expect(route.canActivate).toContain(keepPopout);
    }
  });

  it('refuses a navigation in a window that was opened as a pop-out', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(decide('/popout/reports', '/doc/a')).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('pop-out window'));

    warn.mockRestore();
  });

  it('leaves the main window alone', () => {
    expect(decide('/', '/doc/a')).toBe(true);
  });
});
