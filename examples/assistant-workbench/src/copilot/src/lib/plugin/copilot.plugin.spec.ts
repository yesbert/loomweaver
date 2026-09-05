import { copilotPlugin } from './copilot.plugin';

describe('copilotPlugin', () => {
  it('declares its manifest', () => {
    expect(copilotPlugin.manifest.id).toBe('copilot');
    expect(copilotPlugin.manifest.capabilities).toContain('contributions');
  });
});
