export function shortenedLabelIds(root: HTMLElement): ReadonlySet<string> {
  const shortened = new Set<string>();
  for (const label of root.querySelectorAll<HTMLElement>('[data-rail-label]')) {
    const id = label.dataset['railLabel'];
    if (id && label.scrollHeight - label.clientHeight > 1) {
      shortened.add(id);
    }
  }
  return shortened;
}

export function sameIds(
  a: ReadonlySet<string>,
  b: ReadonlySet<string>,
): boolean {
  return a.size === b.size && [...a].every((id) => b.has(id));
}
