import { isKebabId, toCamelCase, toPascalCase, toTitleCase } from './casing';

describe('casing', () => {
  it('accepts kebab ids and rejects others', () => {
    expect(isKebabId('notes')).toBe(true);
    expect(isKebabId('my-notes')).toBe(true);
    expect(isKebabId('Notes')).toBe(false);
    expect(isKebabId('my_notes')).toBe(false);
    expect(isKebabId('-notes')).toBe(false);
    expect(isKebabId('notes-')).toBe(false);
  });

  it('derives Pascal, camel and title cases', () => {
    expect(toPascalCase('my-notes')).toBe('MyNotes');
    expect(toCamelCase('my-notes')).toBe('myNotes');
    expect(toTitleCase('my-notes')).toBe('My Notes');
    expect(toPascalCase('notes')).toBe('Notes');
  });
});
