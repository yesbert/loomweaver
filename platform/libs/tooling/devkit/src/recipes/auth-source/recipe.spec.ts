import { generate } from '../../lib/generate/generate';
import { authSource, resolveAuthSourceInput } from './recipe';

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
});
