import { addressIsUnder } from './address-reach';

describe('whether an address lies under one that is named', () => {
  it('counts a deeper address', () => {
    expect(addressIsUnder('sales/quotes/q-0006', 'sales/quotes')).toBe(true);
    expect(addressIsUnder('sales/quotes', 'sales')).toBe(true);
  });

  it('counts the address itself', () => {
    expect(addressIsUnder('sales/quotes', 'sales/quotes')).toBe(true);
  });

  it('does not mistake a longer name for a deeper address', () => {
    expect(addressIsUnder('sales/quotesomething', 'sales/quotes')).toBe(false);
    expect(addressIsUnder('salesforce/x', 'sales')).toBe(false);
  });

  it('answers no when nothing addressable is shown', () => {
    expect(addressIsUnder(undefined, 'sales')).toBe(false);
  });

  it('puts everything under the root, as a claim on the root does', () => {
    expect(addressIsUnder('sales/quotes', '')).toBe(true);
    expect(addressIsUnder('', '')).toBe(true);
  });
});
