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

export function matching<T extends { label: string }>(
  query: string,
  rows: readonly T[],
): readonly T[] {
  return rows.filter((row) => fuzzyScore(query, row.label) !== null);
}

export function ranked<T extends { label: string }>(
  query: string,
  rows: readonly T[],
): readonly T[] {
  return rows
    .map((row) => ({ row, score: fuzzyScore(query, row.label) }))
    .filter(
      (scored): scored is { row: T; score: number } => scored.score !== null,
    )
    .toSorted((a, b) => b.score - a.score)
    .map((scored) => scored.row);
}
