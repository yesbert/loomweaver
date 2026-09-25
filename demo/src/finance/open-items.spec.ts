import openItems from '../../public/api/open-items.json';
import { customerName } from '../accounting';
import { openAmount, openReceivables } from './books';

describe('the open items served at /api/open-items.json', () => {
  it('are the receivables finance still waits on, with what is open on each', () => {
    const fromBooks = openReceivables().map((entry) => ({
      number: entry.number,
      customer: customerName(entry.customerId),
      open: openAmount(entry),
    }));

    expect(openItems).toEqual(fromBooks);
  });
});
