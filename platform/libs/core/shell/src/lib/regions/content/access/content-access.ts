import { InjectionToken, Provider, inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AccessRequirement } from '@loomweaver/plugin-sdk';
import { AuthContext } from '../../../auth/auth-context';

/**
 * A distribution's redirect for a gated content route the session cannot reach. Given the
 * attempted path, it returns an in-app URL to redirect to (e.g. the product's login route), or `null`
 * to fall back to the host's neutral "sign-in required" placeholder. LoomWeaver owns no login UI, so
 * this is how a product plugs in its own auth flow. Defaults to `null` (placeholder).
 */
export type UnauthorizedHandler = (attemptedPath: string) => string | null;

export const AUTH_UNAUTHORIZED = new InjectionToken<UnauthorizedHandler | null>(
  'AUTH_UNAUTHORIZED',
  {
    providedIn: 'root',
    factory: () => null,
  },
);

/** A distribution registers a login redirect for gated content routes. */
export function provideUnauthorizedRedirect(
  handler: UnauthorizedHandler,
): Provider {
  return { provide: AUTH_UNAUTHORIZED, useValue: handler };
}

export function accessCanMatch(access: AccessRequirement): CanMatchFn {
  return (_route, segments) => {
    if (inject(AuthContext).meets(access)) {
      return true;
    }
    const attempted = segments.map((s) => s.path).join('/');
    const redirect = inject(AUTH_UNAUTHORIZED)?.(attempted) ?? null;
    return redirect ? inject(Router).parseUrl(redirect) : false;
  };
}
