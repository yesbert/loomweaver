import { InjectionToken } from '@angular/core';
import { Route, Routes } from '@angular/router';

export const DISTRIBUTION_ROUTES = new InjectionToken<Routes>(
  'lw.distribution-routes',
);

export function isCatchAll(route: Route): boolean {
  return (route.path ?? '').startsWith('**');
}
