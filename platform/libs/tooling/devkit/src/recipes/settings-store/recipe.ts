import { FileMap, Recipe } from '../../lib/generate/types';
import { isKebabId, toPascalCase } from '../../lib/generate/casing';

export interface SettingsStoreInput {
  readonly name: string;
}

export interface ResolvedSettingsStore {
  readonly name: string;
  readonly className: string;
}

export function resolveSettingsStoreInput(
  input: SettingsStoreInput,
): ResolvedSettingsStore {
  if (!isKebabId(input.name)) {
    throw new Error(
      `Settings store name must be kebab-case (e.g. "backend"); got "${input.name}".`,
    );
  }
  return { name: input.name, className: toPascalCase(input.name) };
}

function moduleFile(s: ResolvedSettingsStore): string {
  return `// A backend-backed settings store for the SETTINGS_STORE port. The platform
// ships local defaults; the product persists settings against its own backend. Only genuine
// settings flow through this port — working state stays on WORKING_STATE_STORE. Wire it with:
// provideSettingsStore(new ${s.className}SettingsStore()).
import { KeyValueStore } from '@loomweaver/shell';

export class ${s.className}SettingsStore implements KeyValueStore {
  constructor(private readonly baseUrl = '/api/settings') {}

  async get(key: string): Promise<string | undefined> {
    const response = await fetch(this.url(key));
    if (!response.ok) {
      return undefined;
    }
    return response.text();
  }

  async set(key: string, value: string): Promise<void> {
    await fetch(this.url(key), { method: 'PUT', body: value });
  }

  async delete(key: string): Promise<void> {
    await fetch(this.url(key), { method: 'DELETE' });
  }

  private url(key: string): string {
    return \`\${this.baseUrl}/\${encodeURIComponent(key)}\`;
  }
}
`;
}

export const settingsStore: Recipe<SettingsStoreInput> = {
  id: 'settings-store',
  build(input: SettingsStoreInput): FileMap {
    const s = resolveSettingsStoreInput(input);
    return { [`${s.name}-settings-store.ts`]: moduleFile(s) };
  },
};
