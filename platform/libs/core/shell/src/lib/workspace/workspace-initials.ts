const WORD_SPLIT = /[\s\-_/]+/;

const LAST_RESORT_DIGITS = 9;

function wordsOf(name: string): readonly string[] {
  return name.trim().split(WORD_SPLIT).filter(Boolean);
}

export function baseInitials(name: string): string {
  const words = wordsOf(name);
  if (words.length > 1) {
    return ([...words[0]][0] + [...words[1]][0]).toUpperCase();
  }
  const letters = [...(words[0] ?? '')];
  if (letters.length === 0) {
    return '';
  }
  if (letters.length === 1) {
    return letters[0].toUpperCase();
  }
  return (letters[0] + letters[letters.length - 1]).toUpperCase();
}

function* candidatesFor(name: string): Generator<string> {
  const base = baseInitials(name);
  if (base === '') {
    return;
  }
  yield base;
  const letters = [...(wordsOf(name)[0] ?? '')];
  for (let i = 1; i < letters.length; i++) {
    yield (letters[0] + letters[i]).toUpperCase();
  }
  for (let digit = 2; digit <= LAST_RESORT_DIGITS; digit++) {
    yield letters[0].toUpperCase() + digit;
  }
}

export function assignWorkspaceInitials(
  workspaces: readonly { readonly id: string; readonly name: string }[],
): ReadonlyMap<string, string> {
  const taken = new Set<string>();
  const assigned = new Map<string, string>();
  for (const workspace of workspaces) {
    for (const candidate of candidatesFor(workspace.name)) {
      if (taken.has(candidate)) {
        continue;
      }
      taken.add(candidate);
      assigned.set(workspace.id, candidate);
      break;
    }
  }
  return assigned;
}
