import { runInNewContext } from 'node:vm';
import { generate } from '../../lib/generate/generate';
import { resolveFramePluginInput, framePlugin } from './recipe';

describe('framePlugin recipe', () => {
  it('rejects a non-kebab id', () => {
    expect(() => resolveFramePluginInput({ id: 'Notes' })).toThrow(/kebab-case/);
  });

  it('produces the iframe plugin file set', () => {
    const files = generate(framePlugin, { id: 'notes', name: 'Notes' });
    expect(Object.keys(files).toSorted((a, b) => a.localeCompare(b))).toEqual(
      ['README.md', 'plugin.html', 'plugin.js', 'view.html'].toSorted((a, b) => a.localeCompare(b)),
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

  it('connects the surface through the frame kit, so it can be pictured, hold state and fill a toolbar', async () => {
    const view = generate(framePlugin, { id: 'notes', name: 'Notes' })['view.html'];
    const script = view.slice(view.lastIndexOf('<script>') + '<script>'.length, view.lastIndexOf('</script>'));
    const host = { name: 'host' };
    const calls: string[] = [];
    let methods: Record<string, unknown> = {};
    const sandbox = {
      parent: {},
      Penpal: {
        WindowMessenger: class WindowMessenger {},
        connect: (options: { methods: Record<string, unknown> }) => {
          methods = options.methods;
          return { promise: Promise.resolve(host) };
        },
      },
      LwFrame: {
        surfaceMethods: (own: Record<string, unknown>) => ({ ...own, capture: 'kit', slotChanged: 'kit' }),
        applySurfaceState: () => undefined,
        state: { apply: () => undefined },
        connectState: (given: unknown) => {
          calls.push(given === host ? 'state' : 'wrong');
        },
        connectToolbars: (given: unknown) => {
          calls.push(given === host ? 'toolbars' : 'wrong');
        },
      },
    };

    runInNewContext(script, { globalThis: sandbox, ...sandbox });
    await Promise.resolve();

    expect(Object.keys(methods).toSorted((a, b) => a.localeCompare(b))).toEqual(['capture', 'render', 'slotChanged', 'stateChanged']);
    expect(calls).toEqual(['state', 'toolbars']);
    expect(view).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });
});

