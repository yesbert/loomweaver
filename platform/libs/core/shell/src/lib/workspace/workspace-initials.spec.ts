import { assignWorkspaceInitials, baseInitials } from './workspace-initials';

function assign(...names: string[]): string[] {
  const map = assignWorkspaceInitials(
    names.map((name, index) => ({ id: String(index), name })),
  );
  return names.map((_, index) => map.get(String(index)) ?? '');
}

describe('workspace initials', () => {
  it('takes the initials of the first two words', () => {
    expect(baseInitials('Month End')).toBe('ME');
    expect(baseInitials('Sales Pipeline Q3')).toBe('SP');
    expect(baseInitials('my workspace')).toBe('MW');
  });

  it('takes first and last letter of a single word, not the first two', () => {
    expect(baseInitials('Review')).toBe('RW');
    expect(baseInitials('Reports')).toBe('RS');
    expect(baseInitials('Rechnungen')).toBe('RN');
  });

  it('gives a one-letter name that one letter, and a blank name nothing', () => {
    expect(baseInitials('R')).toBe('R');
    expect(baseInitials(' '.repeat(3))).toBe('');
    expect(assign('')).toEqual(['']);
  });

  it('leaves the badges a set already has alone when a colliding one arrives', () => {
    expect(assign('Kunden', 'Konten')).toEqual(['KN', 'KO']);
    expect(assign('Angebote', 'Aufträge', 'Analyse')).toEqual([
      'AE',
      'AU',
      'AN',
    ]);
  });

  it('stays at two characters while the name has letters to offer', () => {
    expect(assign('Daten', 'Design', 'Dashboard')).toEqual(['DN', 'DE', 'DD']);
    for (const badge of assign('Documents', 'Drafts', 'Development')) {
      expect(badge).toHaveLength(2);
    }
  });

  it('falls back to a digit only once a name is exhausted', () => {
    expect(assign('ab', 'ab', 'ab')).toEqual(['AB', 'A2', 'A3']);
  });

  it('separates names that share their whole prefix', () => {
    const badges = assign('Review', 'Reports', 'Rechnungen', 'Recherche');
    expect(new Set(badges).size).toBe(4);
  });

  it('counts characters, not code units, so an accent does not split a letter', () => {
    expect(baseInitials('Präsentation')).toBe('PN');
    expect(baseInitials('Über')).toBe('ÜR');
  });
});
