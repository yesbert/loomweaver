import {
  composeDarkTokens,
  composeTokens,
  isKnownToken,
  ThemeRegistration,
} from './theme-registry-global';

describe('composeTokens', () => {
  it('keeps only whitelisted --lw-* tokens', () => {
    const composed = composeTokens([
      {
        pluginId: 'p',
        tokens: { '--lw-brand': '#111', '--evil': 'red', color: 'blue' },
      },
    ]);
    expect(composed).toEqual({ '--lw-brand': '#111' });
  });

  it('resolves cross-plugin collisions first-wins', () => {
    const composed = composeTokens([
      { pluginId: 'a', tokens: { '--lw-brand': '#aaa' } },
      {
        pluginId: 'b',
        tokens: { '--lw-brand': '#bbb', '--lw-accent': '#ccc' },
      },
    ]);
    expect(composed['--lw-brand']).toBe('#aaa');
    expect(composed['--lw-accent']).toBe('#ccc');
  });

  it('knows the canonical tokens and rejects unknown names', () => {
    expect(isKnownToken('--lw-brand')).toBe(true);
    expect(isKnownToken('--lw-font-sans')).toBe(true);
    expect(isKnownToken('--lw-nope')).toBe(false);
  });
});

describe('composeDarkTokens', () => {
  it('composes only the dark overrides, whitelisted and first-wins', () => {
    const composed = composeDarkTokens([
      {
        pluginId: 'a',
        tokens: { '--lw-brand': '#light' },
        dark: { '--lw-surface': '#111' },
      },
      {
        pluginId: 'b',
        tokens: { '--lw-accent': '#x' },
        dark: { '--lw-surface': '#222', '--evil': 'red' },
      },
    ]);
    expect(composed).toEqual({ '--lw-surface': '#111' });
  });

  it('is empty when no registration supplies dark overrides', () => {
    const composed = composeDarkTokens([
      { pluginId: 'a', tokens: { '--lw-brand': '#aaa' } },
    ]);
    expect(composed).toEqual({});
  });

  it('keeps one owner per token across both schemes, so palettes cannot split', () => {
    const registrations: ThemeRegistration[] = [
      { pluginId: 'a', tokens: { '--lw-surface': '#fff' } },
      { pluginId: 'b', tokens: {}, dark: { '--lw-surface': '#111' } },
    ];

    expect(composeTokens(registrations)).toEqual({ '--lw-surface': '#fff' });
    expect(composeDarkTokens(registrations)).toEqual({});
  });
});
