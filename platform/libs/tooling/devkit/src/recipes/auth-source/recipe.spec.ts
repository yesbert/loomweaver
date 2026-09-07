import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generate } from '../../lib/generate/generate';
import { authSource, resolveAuthSourceInput } from './recipe';

const SAMPLES = join(import.meta.dirname, '../../../../../../../docs/samples.md');

function blockOnThePage(path: string): string {
  const page = readFileSync(SAMPLES, 'utf8');
  const start = page.indexOf(`// ${path}`);
  expect(start, `${path} is a fenced block on the samples page`).toBeGreaterThan(-1);
  const body = page.slice(page.indexOf('\n', start) + 1);
  return body.slice(0, body.indexOf('\n```'));
}

describe('authSource recipe', () => {
  it('rejects a non-kebab name', () => {
    expect(() => resolveAuthSourceInput({ name: 'Dev' })).toThrow(/kebab-case/);
  });

  it('emits a provider-neutral AuthSource module', () => {
    const files = generate(authSource, { name: 'dev' });
    const module = files['dev-auth-source.ts'];
    expect(module).toContain("import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk'");
    expect(module).toContain('export function devAuthSource(): Signal<AuthSnapshot>');
    expect(module).toContain('export function cycleDevUser()');
    expect(module).toContain("roles: ['user', 'admin']");
  });

  it('writes what recipe 12 on the samples page shows, so the table can say the generator writes it', () => {
    const files = generate(authSource, { name: 'dev' });
    expect(files['dev-auth-source.ts'].trimEnd()).toBe(blockOnThePage('src/auth/dev-auth-source.ts'));
    expect(files['dev-session.plugin.ts'].trimEnd()).toBe(blockOnThePage('src/auth/dev-session.plugin.ts'));
  });

  it('writes the verbs, an index and both language bundles beside the source', () => {
    const files = generate(authSource, { name: 'dev' });
    expect(Object.keys(files).toSorted((a, b) => a.localeCompare(b))).toEqual([
      'dev-auth-source.ts',
      'dev-session.plugin.ts',
      'i18n/de.json',
      'i18n/en.json',
      'index.ts',
    ]);
    expect(files['index.ts']).toContain("export { devSessionPlugin } from './dev-session.plugin';");
    expect(JSON.parse(files['i18n/en.json'])).toMatchObject({ signIn: 'Sign in' });
    expect(JSON.parse(files['i18n/de.json'])).toMatchObject({ signIn: 'Anmelden' });
  });

  it('writes the shape alone under --bare', () => {
    expect(Object.keys(generate(authSource, { name: 'dev', bare: true }))).toEqual(['dev-auth-source.ts']);
  });
});
