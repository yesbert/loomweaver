import { Component, inject, provideAppInitializer } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { provideLayout } from '../../../layout/layout';
import { ContentTabsService } from '../tabs/content-tabs.service';
import { provideShellRouter } from './provide-content-router';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

@Component({ selector: 'lw-test-owned', template: '' })
class OwnedPage {}

const LAYOUT = {
  regions: [{ id: 'main', type: 'content', dock: 'center' }],
} as const;

function open(
  owned: readonly { path: string; component?: unknown; redirectTo?: string }[],
  contributed: readonly string[],
  address = '/',
): Router {
  TestBed.configureTestingModule({
    providers: [
      provideAppInitializer(() => {
        inject(Location).go(address);
        const registry = inject(ContributionRegistry);
        for (const path of contributed) {
          registry.addContentRoute({ path, component: TestContent });
        }
      }),
      provideShellRouter(owned as never),
      provideLayout(LAYOUT as never),
    ],
  });
  return TestBed.inject(Router);
}

function contribute(path: string): void {
  TestBed.inject(ContributionRegistry).addContentRoute({
    path,
    component: TestContent,
  });
  TestBed.tick();
}

function landedOn(router: Router): unknown {
  return router.routerState.snapshot.root.firstChild?.routeConfig?.component;
}

describe('routes a distribution owns', () => {
  it('still resolves once the contributed routes are in place', async () => {
    const router = open(
      [{ path: 'legal', component: OwnedPage }],
      ['dashboard'],
    );

    await router.navigateByUrl('/legal');

    expect(router.url).toBe('/legal');
    expect(landedOn(router)).toBe(OwnedPage);
  });

  it('takes effect as a redirect for the address that names no content', async () => {
    const router = open(
      [{ path: '', redirectTo: 'dashboard', pathMatch: 'full' } as never],
      ['dashboard'],
    );

    await router.navigateByUrl('/');

    expect(router.url).toBe('/dashboard');
  });

  it('survives a later change to the contributed routes', async () => {
    const router = open(
      [{ path: 'legal', component: OwnedPage }],
      ['dashboard'],
    );

    contribute('knowledge-base');
    await router.navigateByUrl('/legal');

    expect(router.url).toBe('/legal');
    expect(landedOn(router)).toBe(OwnedPage);
  });

  it('opens no tab and leaves the arrangement alone', async () => {
    const router = open(
      [{ path: 'legal', component: OwnedPage }],
      ['dashboard'],
    );
    const tabs = TestBed.inject(ContentTabsService);

    await router.navigateByUrl('/legal');
    TestBed.tick();

    expect(tabs.tabs().map((tab) => tab.path)).toEqual([]);
  });

  it('answers with a catch-all only where nothing else does', async () => {
    const router = open([{ path: '**', component: OwnedPage }], ['dashboard']);

    await router.navigateByUrl('/dashboard');
    expect(landedOn(router)).toBe(TestContent);

    await router.navigateByUrl('/nowhere');
    expect(landedOn(router)).toBe(OwnedPage);
  });

  it('wins an address a plugin also declares, and says so', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const router = open(
      [{ path: 'dashboard', component: OwnedPage }],
      ['dashboard'],
    );

    await router.navigateByUrl('/dashboard');

    expect(landedOn(router)).toBe(OwnedPage);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('dashboard');

    contribute('knowledge-base');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
