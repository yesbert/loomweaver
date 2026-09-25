import {
  LOOMWEAVER_IDENTITY,
  PRODUCT_IDENTITY,
  ProductIdentity,
  provideProductIdentity,
} from './product-identity.js';

describe('product identity', () => {
  it('provides a bare-platform LoomWeaver fallback', () => {
    expect(LOOMWEAVER_IDENTITY.name).toBe('LoomWeaver');
    expect(PRODUCT_IDENTITY.toString()).toContain('PRODUCT_IDENTITY');
  });

  it('builds a value provider for a distribution identity', () => {
    const studio: ProductIdentity = {
      name: 'Acme Studio',
      tagline: 'testbed.tagline',
      logoUrl: 'testbed-icon.png',
    };

    expect(provideProductIdentity(studio)).toEqual({
      provide: PRODUCT_IDENTITY,
      useValue: studio,
    });
  });
});
