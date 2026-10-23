import { describe, expect, it } from 'vitest';
import { nameShowing, nameWithHint } from './name-showing';

describe('nameShowing', () => {
  it('puts the shown words before the purpose', () => {
    expect(nameShowing(['NR'], 'Account')).toBe('NR, Account');
  });

  it('keeps several shown words in the order they are shown', () => {
    expect(
      nameShowing(['AL', 'Ada Lovelace', 'ada@testbed.local'], 'Profile'),
    ).toBe('AL, Ada Lovelace, ada@testbed.local, Profile');
  });

  it('returns the purpose where it already contains the shown words', () => {
    expect(nameShowing(['EN'], 'EN, Language')).toBe('EN, Language');
  });

  it('compares words regardless of case and punctuation', () => {
    expect(nameShowing(['Entry list'], 'entry-list: Entries')).toBe(
      'entry-list: Entries',
    );
  });

  it('does not take a word inside another word for the shown one', () => {
    expect(nameShowing(['EN'], 'Enable')).toBe('EN, Enable');
  });

  it('returns the purpose where a shown word is its own', () => {
    expect(nameShowing(['Account'], 'Account')).toBe('Account');
  });

  it('returns the shown words where the purpose is among them', () => {
    expect(nameShowing(['AL', 'Ada Lovelace'], 'Ada Lovelace')).toBe(
      'AL, Ada Lovelace',
    );
  });

  it('returns the purpose where nothing is shown', () => {
    expect(nameShowing([undefined, ''], 'Account')).toBe('Account');
  });

  it('returns the shown words where there is no purpose', () => {
    expect(nameShowing(['Default'], '')).toBe('Default');
  });
});

describe('nameWithHint', () => {
  it('puts a shown shortcut after the name', () => {
    expect(nameWithHint('Command palette', '⌘K')).toBe('Command palette ⌘K');
  });

  it('leaves the name alone where no shortcut is shown', () => {
    expect(nameWithHint('Command palette', undefined)).toBe('Command palette');
  });
});
