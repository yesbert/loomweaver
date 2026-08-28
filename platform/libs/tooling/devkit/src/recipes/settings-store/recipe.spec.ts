import { generate } from '../../lib/generate/generate';
import { resolveSettingsStoreInput, settingsStore } from './recipe';

describe('settingsStore recipe', () => {
  it('rejects a non-kebab name', () => {
    expect(() => resolveSettingsStoreInput({ name: 'Backend' })).toThrow(/kebab-case/);
  });

  it('emits a settings-store implementation against the KeyValueStore shape', () => {
    const files = generate(settingsStore, { name: 'backend' });
    const module = files['backend-settings-store.ts'];
    expect(module).toContain("import { KeyValueStore } from '@loomweaver/shell'");
    expect(module).toContain('export class BackendSettingsStore implements KeyValueStore');
    expect(module).toContain('async get(key: string): Promise<string | undefined>');
    expect(module).toContain('async set(key: string, value: string): Promise<void>');
    expect(module).toContain('async delete(key: string): Promise<void>');
  });
});
