import { runInInjectionContext, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { WORKSPACE_SETTLEMENT } from './workspace-settlement';
import { buildContentRoutes } from './content-route-table';
import { keepPopout } from './keep-popout.guard';
import { settleWorkspace, withholdSettlement } from './settle-workspace.guard';
import { BootAddress } from './boot-address';

describe('settling the workspace before content is shown', () => {
  it('guards every content route, so no way in can be forgotten', () => {
    const routes = buildContentRoutes([
      { path: '', pluginId: 'p', component: class {} } as never,
      { path: 'quotes/:id', pluginId: 'p', component: class {} } as never,
      {
        path: 'gated',
        pluginId: 'p',
        component: class {},
        access: { authenticated: true },
      } as never,
    ]);

    const guarded = routes.filter((route) =>
      route.canActivate?.includes(settleWorkspace),
    );
    expect(guarded).toHaveLength(3);
    for (const route of guarded) {
      expect(route.canActivate).toEqual([keepPopout, settleWorkspace]);
    }
  });

  it('guards the placeholder that stands in for content nobody answers, so its address lands in the workspace that claims it', () => {
    const routes = buildContentRoutes(
      [],
      [{ id: 'testbed.notes', path: 'notes', component: class {} } as never],
    );

    expect(routes).toHaveLength(1);
    expect(routes[0].canActivate).toEqual([keepPopout, settleWorkspace]);
  });

  it('hands the address on without its leading slash, and never blocks the navigation', async () => {
    const settled: string[] = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WORKSPACE_SETTLEMENT,
          useValue: {
            settle: async (path: string) => {
              settled.push(path);
            },
          },
        },
      ],
    });

    const allowed = await runInInjectionContext(TestBed.inject(Injector), () =>
      settleWorkspace(
        {} as ActivatedRouteSnapshot,
        { url: '/quotes/q-0007' } as RouterStateSnapshot,
      ),
    );

    expect(settled).toEqual(['quotes/q-0007']);
    expect(allowed).toBe(true);
  });

  for (const [where, boot, expected] of [
    ['the main window', '/', ['records']],
    ['a pop-out window', '/popout/notes', []],
  ] as const) {
    it(`notes a visit that waits for the session in ${where}`, () => {
      const withheld: string[] = [];
      TestBed.configureTestingModule({
        providers: [
          { provide: BootAddress, useValue: { path: boot } },
          {
            provide: WORKSPACE_SETTLEMENT,
            useValue: {
              withhold: (path: string) => {
                withheld.push(path);
              },
            },
          },
        ],
      });

      const allowed = runInInjectionContext(TestBed.inject(Injector), () =>
        withholdSettlement(
          {} as ActivatedRouteSnapshot,
          { url: '/records' } as RouterStateSnapshot,
        ),
      );

      expect(allowed).toBe(true);
      expect(withheld).toEqual(expected);
    });
  }
});
