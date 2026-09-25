export function fuzzyScore(query: string, label: string): number | null {
  const needle = query.toLowerCase();
  if (!needle) {
    return 0;
  }
  const haystack = label.toLowerCase();
  let score = 0;
  let searchFrom = 0;
  let previous = -2;
  for (const char of needle) {
    const found = haystack.indexOf(char, searchFrom);
    if (found === -1) {
      return null;
    }
    if (found === 0 || haystack[found - 1] === ' ') {
      score += 3;
    }
    if (found === previous + 1) {
      score += 2;
    }
    previous = found;
    searchFrom = found + 1;
  }
  return score;
}
