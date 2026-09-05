import { assistantPlugin } from './assistant.plugin';

describe('assistantPlugin', () => {
  it('declares its manifest', () => {
    expect(assistantPlugin.manifest.id).toBe('assistant');
    expect(assistantPlugin.manifest.capabilities).toContain('contributions');
  });
});
