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

export type RovingAxis = 'horizontal' | 'vertical';

const STEP_KEYS: Readonly<Record<RovingAxis, { next: string; previous: string }>> = {
  horizontal: { next: 'ArrowRight', previous: 'ArrowLeft' },
  vertical: { next: 'ArrowDown', previous: 'ArrowUp' },
};

export function rovingStep(
  key: string,
  index: number,
  count: number,
  axis: RovingAxis,
): number | undefined {
  if (count === 0) {
    return undefined;
  }
  const { next, previous } = STEP_KEYS[axis];
  switch (key) {
    case next: {
      return index < 0 ? 0 : (index + 1) % count;
    }
    case previous: {
      return index < 0 ? count - 1 : (index - 1 + count) % count;
    }
    case 'Home': {
      return 0;
    }
    case 'End': {
      return count - 1;
    }
    default: {
      return undefined;
    }
  }
}
