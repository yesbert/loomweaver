import { OpenTabInput, Surface } from '@loomweaver/plugin-sdk';
import {
  sanitizeRpcSurface,
  sanitizeRpcTabInput,
} from '../plugin/frame/frame-rpc-sanitize';
import { tabBadgeOf } from './tab-badge';
import {
  FrameRpcDeps,
  frameRpcMethods,
} from '../plugin/frame/frame-rpc-methods';

describe('a badge as it is read from outside', () => {
  it('keeps a text, an icon, a tone and whether the text is literal', () => {
    expect(
      tabBadgeOf({ text: 'Beta', textIsLiteral: true, icon: 'flask', tone: 'brand' }),
    ).toEqual({ text: 'Beta', textIsLiteral: true, icon: 'flask', tone: 'brand' });
  });

  it('is no badge without a text or an icon', () => {
    expect(tabBadgeOf({ tone: 'brand' })).toBeUndefined();
    expect(tabBadgeOf({ text: '' })).toBeUndefined();
    expect(tabBadgeOf('Beta')).toBeUndefined();
    expect(tabBadgeOf(null)).toBeUndefined();
  });

  it('drops a tone it does not know and the neutral one it does not need', () => {
    expect(tabBadgeOf({ text: 'x', tone: 'loud' })).toEqual({ text: 'x' });
    expect(tabBadgeOf({ text: 'x', tone: 'neutral' })).toEqual({ text: 'x' });
  });

  it('bounds a literal text by characters, and leaves a key whole', () => {
    expect(
      tabBadgeOf({ text: '😀'.repeat(60), textIsLiteral: true })?.text,
    ).toBe('😀'.repeat(40));
    const key = 'nextpa.assistants.advanced.badge.developer';
    expect(tabBadgeOf({ text: key })?.text).toBe(key);
  });

  it('crosses from an isolated plugin on a surface it registers', () => {
    const surface = sanitizeRpcSurface(
      'sandboxed',
      {
        id: 'notes',
        title: 'notes.title',
        iframe: 'https://plugins.example/notes',
        docks: ['left-panel'],
        badge: { text: 'Beta', tone: 'loud', extra: true },
      } as unknown as Surface,
      ['https://plugins.example'],
    );

    expect(surface.badge).toEqual({ text: 'Beta' });
  });

  it('crosses from an isolated plugin on a tab it opens', () => {
    const input = sanitizeRpcTabInput({
      path: 'notes/1',
      title: 'One',
      badge: { icon: 'flask', tone: 'success' },
    } as OpenTabInput);

    expect(input.badge).toEqual({ icon: 'flask', tone: 'success' });
  });

  it('reaches the surface badge from an isolated plugin, read as it would be from anywhere else', () => {
    const updateSurfaceBadge = vi.fn();
    const methods = frameRpcMethods({
      pluginId: 'sandboxed',
      ctx: { updateSurfaceBadge },
      watched: new Map(),
      reportRefusal: () => undefined,
    } as unknown as FrameRpcDeps);

    methods.updateSurfaceBadge('notes', {
      text: 'Beta',
      tone: 'loud',
    } as unknown as { text: string });
    methods.updateSurfaceBadge('notes', null);

    expect(updateSurfaceBadge).toHaveBeenNthCalledWith(1, 'notes', { text: 'Beta' });
    expect(updateSurfaceBadge).toHaveBeenNthCalledWith(2, 'notes', null);
  });
});
