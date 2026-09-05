import { ticketStore } from './ticket-store';

describe('ticketStore', () => {
  beforeEach(() => ticketStore.reset());

  it('lists every ticket, or only those in one status', () => {
    expect(ticketStore.list()).toHaveLength(6);
    ticketStore.assign('T-1041', 'dana');
    expect(ticketStore.list('in progress').map((one) => one.number)).toEqual(['T-1041']);
  });

  it('finds a ticket by number, whatever the case', () => {
    expect(ticketStore.get('t-1043').subject).toContain('CSV');
  });

  it('refuses a number it does not know', () => {
    expect(() => ticketStore.get('T-9')).toThrow('There is no ticket T-9.');
  });

  it('keeps a reply on the ticket', () => {
    expect(ticketStore.reply('T-1041', 'On it.').replies).toBe(1);
    expect(ticketStore.get('T-1041').replies[0].text).toBe('On it.');
  });
});
