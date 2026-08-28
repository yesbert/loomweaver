import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  PartialMatchRouteSnapshot,
  Route,
  Router,
  UrlSegment,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { ANONYMOUS, AccessRequirement, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { accessCanMatch, provideUnauthorizedRedirect } from './content-access';
import { AUTH_SOURCE } from '../../../auth/auth-context';

function evaluate(
  access: AccessRequirement,
  auth: WritableSignal<AuthSnapshot>,
  extraProviders: unknown[] = [],
): boolean | UrlTree {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AUTH_SOURCE, useValue: auth },
      ...extraProviders,
    ],
  });
  const guard = accessCanMatch(access);
  const segments = [new UrlSegment('secret', {})];
  return TestBed.runInInjectionContext(() =>
    guard({} as Route, segments, {} as PartialMatchRouteSnapshot),
  ) as boolean | UrlTree;
}

describe('accessCanMatch', () => {
  it('matches when the session meets the requirement', () => {
    const auth = signal<AuthSnapshot>({
      authenticated: true,
      roles: ['admin'],
      claims: {},
    });
    expect(evaluate({ anyRole: ['admin'] }, auth)).toBe(true);
  });

  it('falls through to the placeholder (returns false) when unmet and no redirect is set', () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    expect(evaluate({ anyRole: ['admin'] }, auth)).toBe(false);
  });

  it('redirects via the distribution handler when unmet and one is provided', () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    const result = evaluate({ anyRole: ['admin'] }, auth, [
      provideUnauthorizedRedirect((path) => `/login?from=${path}`),
    ]);

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/login?from=secret',
    );
  });
});
