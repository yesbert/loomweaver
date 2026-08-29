import { generate } from '../../lib/generate/generate';
import { resolveFramePluginInput, framePlugin } from './recipe';

describe('framePlugin recipe', () => {
  it('rejects a non-kebab id', () => {
    expect(() => resolveFramePluginInput({ id: 'Notes' })).toThrow(/kebab-case/);
  });

  it('produces the iframe plugin file set', () => {
    const files = generate(framePlugin, { id: 'notes', name: 'Notes' });
    expect(Object.keys(files).toSorted()).toEqual(
      ['README.md', 'plugin.html', 'plugin.js', 'view.html'].toSorted(),
    );
  });

  it('wires Penpal RPC and a routable iframe surface', () => {
    const files = generate(framePlugin, { id: 'notes', name: 'Notes' });
    const js = files['plugin.js'];
    expect(js).toContain('Penpal.connect');
    expect(js).toContain('ctx.registerSurface(');
    expect(js).toContain("id: 'notes.view'");
    expect(js).toContain("iframe: '/notes/view.html'");
    expect(js).toContain("path: 'notes'");
    expect(js).toContain('ctx.toast(');
    expect(files['plugin.html']).toContain('/frame-kit/penpal.global.js');
    expect(files['plugin.html']).toContain('./plugin.js');
    expect(files['view.html']).toContain('Notes');
  });

  it('references the frame UI kit assets in the surface', () => {
    const files = generate(framePlugin, { id: 'notes', name: 'Notes' });
    const view = files['view.html'];
    expect(view).toContain('/frame-kit/lw-frame.css');
    expect(view).toContain('/frame-kit/lw-elements.global.js');
    expect(view).toContain('LwFrame.applySurfaceState');
    expect(files['README.md']).toContain('@loomweaver/frame-kit');
  });
});
