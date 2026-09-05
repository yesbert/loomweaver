import { cleanKey, looksLikeKey } from './openrouter-key';

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
