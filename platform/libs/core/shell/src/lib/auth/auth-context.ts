import { computed, EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders, provideEnvironmentInitializer, Provider, Service, signal, Signal } from '@angular/core';
import {
  AccessRequirement,
  ANONYMOUS,
  AuthSnapshot,
  isAccessDisabled,
  isAccessVisible,
  meetsAccess,
} from '@loomweaver/plugin-sdk';
import { IdentityChangeReload } from './identity-change';

const ANONYMOUS_SOURCE: Signal<AuthSnapshot> = signal(ANONYMOUS).asReadonly();

/**
 * The distribution-supplied session snapshot signal. Defaults to **anonymous** so the
 * bare platform runs with nobody signed in; a distribution maps its product's auth (OIDC/custom/…)
 * into an {@link AuthSnapshot} signal via {@link provideAuthSource}. LoomWeaver never owns auth — it
 * only reads this signal.
 */
export const AUTH_SOURCE = new InjectionToken<Signal<AuthSnapshot>>(
  'AUTH_SOURCE',
  {
    providedIn: 'root',
    factory: () => ANONYMOUS_SOURCE,
  },
);

/**
 * What the shell does when one established identity is replaced by another.
 * The comparison anchor is {@link AuthSnapshot.subject}.
 */
export interface AuthSourceOptions {
  /**
   * `'reload'`: when a snapshot carries a **different** non-empty `subject` than the one already
   * established this app lifetime, the shell performs a full `location.reload()` — the
   * guaranteed-clean user switch (no pane trees, tab titles or plugin in-memory state of the
   * previous user survive; paired with an identity-scoped settings store, the new session
   * re-hydrates entirely from its own namespace). First sign-in (anonymous → subject) and
   * sign-out (subject → anonymous) never fire, so an async session restore at boot causes no
   * reload flicker. Snapshots without a `subject` never fire either. Default: `'ignore'`.
   */
  onIdentityChange?: 'reload' | 'ignore';
}

/**
 * A distribution declares its auth source. The factory runs in the injection context, so it can
 * `inject()` the product's own session/BFF service and return a signal derived from it. Pass
 * `options` to opt into the identity-change policy: with
 * `{ onIdentityChange: 'reload' }` a user switch on a shared browser reloads the app instead of
 * leaving the previous user's in-memory state alive.
 */
export function provideAuthSource(
  factory: () => Signal<AuthSnapshot>,
  options?: AuthSourceOptions,
): EnvironmentProviders {
  const providers: (Provider | EnvironmentProviders)[] = [
    { provide: AUTH_SOURCE, useFactory: factory },
  ];
  if (options?.onIdentityChange === 'reload') {
    providers.push(
      provideEnvironmentInitializer(() =>
        inject(IdentityChangeReload).start(inject(AUTH_SOURCE)),
      ),
    );
  }
  return makeEnvironmentProviders(providers);
}

/**
 * Reactive read-only view of the current session, plus the gating predicates the host chrome uses to
 * hide/disable contributions. Roles/claims are opaque — this service matches, never
 * interprets. Client-side gating is presentation, not a security boundary.
 */
@Service()
export class AuthContext {
  private readonly source = inject(AUTH_SOURCE);

  /** The current session snapshot (reactive). */
  readonly state = computed(() => this.source());
  /** Whether someone is signed in. */
  readonly authenticated = computed(() => this.state().authenticated);
  /** The current principal's roles. */
  readonly roles = computed(() => this.state().roles);

  /** True if the current principal holds `role`. */
  hasRole(role: string): boolean {
    return this.state().roles.includes(role);
  }

  /** True if the current session satisfies `access` (undefined = always). */
  meets(access: AccessRequirement | undefined): boolean {
    return meetsAccess(access, this.state());
  }

  /** Whether a chrome item with this requirement should render (unmet + hide → false). */
  visible(access: AccessRequirement | undefined): boolean {
    return isAccessVisible(access, this.state());
  }

  /** Whether a rendered chrome item with this requirement should be disabled (unmet + disable). */
  disabled(access: AccessRequirement | undefined): boolean {
    return isAccessDisabled(access, this.state());
  }
}
