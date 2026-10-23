export function nameShowing(
  shown: readonly (string | undefined)[],
  purpose: string,
): string {
  const words = shown.filter((text): text is string => !!text?.trim());
  const spoken = words.join(', ');
  if (!spoken) {
    return purpose;
  }
  if (contains(purpose, spoken)) {
    return purpose;
  }
  if (!purpose.trim() || contains(spoken, purpose)) {
    return spoken;
  }
  return `${spoken}, ${purpose}`;
}

export function nameWithHint(name: string, hint: string | undefined): string {
  return hint && !name.includes(hint) ? `${name} ${hint}` : name;
}

function contains(text: string, part: string): boolean {
  return ` ${wordsOf(text)} `.includes(` ${wordsOf(part)} `);
}

function wordsOf(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
