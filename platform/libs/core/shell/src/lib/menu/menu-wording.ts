export type MenuLabel = string | ((translate: (key: string) => string) => string);

export function wordEntries(
  labelled: readonly [HTMLElement, MenuLabel][],
  translate: (key: string) => string,
): void {
  for (const [item, label] of labelled) {
    const words =
      typeof label === 'string' ? translate(label) : label(translate);
    if (item.getAttribute('label') !== words) {
      item.setAttribute('label', words);
    }
  }
}
