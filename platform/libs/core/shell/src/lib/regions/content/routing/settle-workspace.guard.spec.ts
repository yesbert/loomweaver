import { runInInjectionContext, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { WORKSPACE_CLAIMS } from '../../../foundation/workspace-claims';
import { buildContentRoutes } from './content-router';
import { keepPopout } from './keep-popout.guard';
import { settleWorkspace } from './settle-workspace.guard';

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

  it('hands the address on without its leading slash, and never blocks the navigation', async () => {
    const settled: string[] = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WORKSPACE_CLAIMS,
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
});
