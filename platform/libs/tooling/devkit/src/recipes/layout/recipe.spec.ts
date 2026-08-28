import { generate } from '../../lib/generate/generate';
import { layout, resolveLayoutInput } from './recipe';

describe('layout recipe', () => {
  it('defaults the name to base', () => {
    expect(resolveLayoutInput({}).name).toBe('base');
    expect(resolveLayoutInput({}).propertyName).toBe('base');
  });

  it('emits a ShellLayout with the weaver-default region ids', () => {
    const module = generate(layout, { name: 'base' })['base-layout.ts'];
    expect(module).toContain("import { ShellLayout } from '@loomweaver/shell'");
    expect(module).toContain('export const baseLayout: ShellLayout');
    expect(module).toContain("{ id: 'primary', type: 'rail', dock: 'left' }");
    expect(module).toContain("{ id: 'status-bar', type: 'bar', dock: 'bottom' }");
    expect(module).toContain("{ id: 'main', type: 'content', dock: 'center' }");
  });
});
