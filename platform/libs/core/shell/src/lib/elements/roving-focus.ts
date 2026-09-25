export function rovingTabIndex(
  items: readonly HTMLElement[],
  activeIndex: number,
): void {
  for (const [index, item] of items.entries()) {
    item.tabIndex = index === activeIndex ? 0 : -1;
  }
}

export function focusAndReveal(item: HTMLElement): void {
  item.focus();
  item.scrollIntoView?.({ block: 'nearest' });
}
