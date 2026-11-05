import { Component, inject, provideAppInitializer } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import {
  provideRouter,
  Router,
  RouteReuseStrategy,
  withDisabledInitialNavigation,
} from '@angular/router';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { ContentRouter } from './content-router';
import { ContentReuseStrategy } from './content-reuse-strategy';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

async function openAt(address: string): Promise<Router> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([], withDisabledInitialNavigation()),
      provideLocationMocks(),
      { provide: RouteReuseStrategy, useExisting: ContentReuseStrategy },
      provideAppInitializer(() => {
        inject(Location).go(address);
      }),
    ],
  });
  const router = TestBed.inject(Router);
  TestBed.inject(ContentRouter).start();
  await router.navigateByUrl(TestBed.inject(Location).path() || '/');
  return router;
}

function arrive(path: string): void {
  TestBed.inject(ContributionRegistry).addContentRoute({
    path,
    component: TestContent,
  });
  TestBed.tick();
}

async function turn(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('completing the address the application was opened at', () => {
  it('leaves the user where they went', async () => {
    const router = await openAt('/dashboard');
    arrive('knowledge-base');
    await turn();

    await router.navigateByUrl('/knowledge-base');
    expect(router.url).toBe('/knowledge-base');

    arrive('dashboard');
    await turn();

    expect(router.url).toBe('/knowledge-base');
  });

  it('lands on an opening address with encoded characters before its content has arrived', async () => {
    const router = await openAt('/people/M%C3%BCller%20&%20S%C3%B6hne');

    expect(router.url).toBe('/people/M%C3%BCller%20&%20S%C3%B6hne');

    arrive('people/:name');
    await turn();

    expect(router.url).toBe('/people/M%C3%BCller%20&%20S%C3%B6hne');
  });

  it('reaches content declared at an address with characters the address encodes', async () => {
    const router = await openAt('/');
    arrive('übersicht/:id');
    await turn();

    await router.navigateByUrl('/%C3%BCbersicht/5');

    expect(router.url).toBe('/%C3%BCbersicht/5');
  });

  it('still reaches the content where the user has not moved', async () => {
    const router = await openAt('/dashboard');

    arrive('dashboard');
    await turn();

    expect(router.url).toBe('/dashboard');
  });
});
