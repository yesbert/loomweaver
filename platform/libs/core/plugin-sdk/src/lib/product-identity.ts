import { InjectionToken, Provider } from '@angular/core';

/**
 * The product a LoomWeaver installation presents as (name, tagline, logo).
 *
 * Branding lives in the distribution (composition root), never in the platform
 * core: a distribution provides its identity, the neutral shell renders it. The
 * bare platform falls back to {@link LOOMWEAVER_IDENTITY}.
 */
export interface ProductIdentity {
  /** Literal brand name, e.g. `Acme Studio`. Not localized. */
  readonly name: string;
  /** Transloco key for the tagline (a literal renders as-is if it is no key). */
  readonly tagline: string;
  /** URL/path to the square product logo. */
  readonly logoUrl: string;
}

/** Bare-platform fallback used when no distribution configures an identity. */
export const LOOMWEAVER_IDENTITY: ProductIdentity = {
  name: 'LoomWeaver',
  tagline: 'shell.tagline',
  logoUrl: 'loom-icon-64.png',
};

/**
 * Active product identity. Defaults to {@link LOOMWEAVER_IDENTITY}; a
 * distribution overrides it via {@link provideProductIdentity}.
 */
export const PRODUCT_IDENTITY = new InjectionToken<ProductIdentity>(
  'PRODUCT_IDENTITY',
  { providedIn: 'root', factory: () => LOOMWEAVER_IDENTITY },
);

/** Provider a distribution uses to declare its product identity. */
export function provideProductIdentity(identity: ProductIdentity): Provider {
  return { provide: PRODUCT_IDENTITY, useValue: identity };
}
