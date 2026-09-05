import { ticketsPlugin } from './tickets.plugin';

describe('ticketsPlugin', () => {
  it('declares its manifest', () => {
    expect(ticketsPlugin.manifest.id).toBe('tickets');
    expect(ticketsPlugin.manifest.capabilities).toContain('contributions');
  });
});
