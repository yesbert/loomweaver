import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { AUTH_SOURCE, AuthContext } from './auth-context';

function withAuth(auth: WritableSignal<AuthSnapshot>): AuthContext {
  TestBed.configureTestingModule({
    providers: [{ provide: AUTH_SOURCE, useValue: auth }],
  });
  return TestBed.inject(AuthContext);
}

describe('AuthContext', () => {
  it('defaults to anonymous when no distribution provides a source', () => {
    const ctx = TestBed.inject(AuthContext);
    expect(ctx.authenticated()).toBe(false);
    expect(ctx.roles()).toEqual([]);
  });

  it('reflects the provided source reactively', () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    const ctx = withAuth(auth);
    expect(ctx.authenticated()).toBe(false);
    expect(ctx.hasRole('admin')).toBe(false);

    auth.set({ authenticated: true, roles: ['admin'], claims: {} });
    expect(ctx.authenticated()).toBe(true);
    expect(ctx.hasRole('admin')).toBe(true);
  });

  it('derives visible/disabled from the current session', () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    const ctx = withAuth(auth);
    expect(ctx.visible({ anyRole: ['admin'] })).toBe(false);
    expect(ctx.disabled({ authenticated: true, mode: 'disable' })).toBe(true);

    auth.set({ authenticated: true, roles: ['admin'], claims: {} });
    expect(ctx.visible({ anyRole: ['admin'] })).toBe(true);
    expect(ctx.disabled({ authenticated: true, mode: 'disable' })).toBe(false);
  });
});
