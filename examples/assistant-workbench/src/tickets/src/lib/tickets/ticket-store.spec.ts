import { ticketStore } from './ticket-store';

describe('ticketStore', () => {
  beforeEach(() => ticketStore.reset());

  it('lists every ticket, or only those in one status', () => {
    expect(ticketStore.list()).toHaveLength(6);
    ticketStore.assign('T-1041', 'dana');
    expect(ticketStore.list('in progress').map((one) => one.number)).toEqual(['T-1041']);
  });

  it('opens a ticket by number, whatever the case, and selects it', () => {
    expect(ticketStore.open('t-1043').subject).toContain('CSV');
    expect(ticketStore.selected()?.number).toBe('T-1043');
  });

  it('refuses a number it does not know', () => {
    expect(() => ticketStore.open('T-9')).toThrow('There is no ticket T-9.');
  });

  it('keeps a reply on the ticket', () => {
    expect(ticketStore.reply('T-1041', 'On it.').replies).toBe(1);
    expect(ticketStore.open('T-1041').replies[0].text).toBe('On it.');
  });
});
