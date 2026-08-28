import openItems from '../../public/api/open-items.json';
import { customerById, quoteTotals, quotes } from '../accounting';

describe('the open items served at /api/open-items.json', () => {
  it('says what the accounting library says is still out with customers', () => {
    const fromLibrary = quotes()
      .filter((quote) => quote.status === 'sent')
      .map((quote) => ({
        number: quote.number,
        customer: customerById(quote.customerId)?.name,
        gross: quoteTotals(quote).gross,
      }));

    expect(openItems).toEqual(fromLibrary);
  });
});
