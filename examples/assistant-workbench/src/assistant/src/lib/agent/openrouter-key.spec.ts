import { cleanKey, looksLikeKey, openRouterKey } from './openrouter-key';

describe('cleanKey', () => {
  it('keeps a plain key as it is', () => {
    expect(cleanKey('sk-or-v1-abc')).toBe('sk-or-v1-abc');
  });

  it('strips what a copy from a code sample drags along', () => {
    expect(cleanKey("  Authorization: 'Bearer sk-or-v1-abc',")).toBe('sk-or-v1-abc');
    expect(cleanKey('Bearer Bearer sk-or-v1-abc')).toBe('sk-or-v1-abc');
    expect(cleanKey('"sk-or-v1-abc"')).toBe('sk-or-v1-abc');
  });
});

describe('looksLikeKey', () => {
  it('accepts an OpenRouter key and refuses anything else', () => {
    expect(looksLikeKey('sk-or-v1-abc')).toBe(true);
    expect(looksLikeKey('abc')).toBe(false);
    expect(looksLikeKey('sk-or-v1 abc')).toBe(false);
  });
});

describe('openRouterKey', () => {
  afterEach(() => openRouterKey.forget());

  it('keeps a key that looks like one, cleaned, and remembers it in this browser', () => {
    expect(openRouterKey.use('Bearer sk-or-v1-abc')).toBe(true);
    expect(openRouterKey.value()).toBe('sk-or-v1-abc');
    expect(localStorage.getItem('assistant-workbench.openrouter-key')).toBe('sk-or-v1-abc');
  });

  it('refuses what is not a key and keeps the one it had', () => {
    openRouterKey.use('sk-or-v1-abc');
    expect(openRouterKey.use('hello')).toBe(false);
    expect(openRouterKey.value()).toBe('sk-or-v1-abc');
  });

  it('forgets the key here and in this browser', () => {
    openRouterKey.use('sk-or-v1-abc');
    openRouterKey.forget();
    expect(openRouterKey.value()).toBe('');
    expect(localStorage.getItem('assistant-workbench.openrouter-key')).toBeNull();
  });
});
