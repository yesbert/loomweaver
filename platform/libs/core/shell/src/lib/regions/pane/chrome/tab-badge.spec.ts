import { OpenTabInput, Surface } from '@loomweaver/plugin-sdk';
import {
  sanitizeRpcSurface,
  sanitizeRpcTabInput,
} from '../../../plugin/sandbox/sandbox-rpc-sanitize';
import { tabBadgeOf } from './tab-badge';

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

  it('bounds the text', () => {
    expect(tabBadgeOf({ text: 'x'.repeat(200) })?.text?.length).toBe(40);
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
});
