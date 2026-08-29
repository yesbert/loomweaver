import { Disposable } from '@loomweaver/plugin-sdk';
import { IconRegistry } from './icon-registry';

const SVG_A = '<svg viewBox="0 0 1 1"><path d="M0 0h4"/></svg>';
const SVG_B = '<svg viewBox="0 0 2 2"><path d="M9 9h9"/></svg>';

describe('IconRegistry (delegates to the module-global registry)', () => {
  let registry: IconRegistry;
  let disposers: Disposable[];

  beforeEach(() => {
    registry = new IconRegistry();
    disposers = [];
  });
  afterEach(() => { for (const d of disposers) d.dispose() });

  const register = (
    plugin: string,
    icons: Record<string, string>,
  ): Disposable => {
    const disposable = registry.register(plugin, icons);
    disposers.push(disposable);
    return disposable;
  };

  it('registers a contributed name and resolves it to its SVG', () => {
    register('notes', { 'test.doc': SVG_A });
    expect(registry.resolve('test.doc')).toContain('M0 0h4');
  });

  it('resolves an unknown name to undefined', () => {
    expect(registry.resolve('test.nope')).toBeUndefined();
  });

  it('removes exactly the names it added when disposed', () => {
    register('notes', { 'test.doc': SVG_A, 'test.graph': SVG_B }).dispose();
    expect(registry.resolve('test.doc')).toBeUndefined();
    expect(registry.resolve('test.graph')).toBeUndefined();
  });

  it('rejects a name already taken by another plugin (first-wins) with a warning', () => {
    const warn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    register('notes', { 'test.doc': SVG_A });
    register('tasks', { 'test.doc': SVG_B });

    expect(registry.resolve('test.doc')).toContain('M0 0h4');
    expect(registry.resolve('test.doc')).not.toContain('M9 9h9');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('test.doc'));
    warn.mockRestore();
  });

  it('does not let a contribution shadow a first-party name', () => {
    const warn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const firstParty = registry.resolve('search');

    register('notes', { search: SVG_A });

    expect(registry.resolve('search')).toBe(firstParty);
    expect(registry.resolve('search')).not.toBe(SVG_A);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('search'));
    warn.mockRestore();
  });

  it('sanitizes contributed SVG: scripts and event handlers never reach the DOM', () => {
    register('evil', {
      'test.bomb':
        '<svg onload="alert(1)"><script>steal()</script><path d="M0 0h4"/></svg>',
    });

    const stored = registry.resolve('test.bomb') ?? '';
    expect(stored).toContain('<path');
    expect(stored).not.toContain('script');
    expect(stored).not.toContain('onload');
  });

  it('drops an "icon" that does not survive sanitization entirely', () => {
    const warn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    register('evil', { 'test.empty': '<script>steal()</script>' });
    expect(registry.resolve('test.empty')).toBeUndefined();
    warn.mockRestore();
  });
});
