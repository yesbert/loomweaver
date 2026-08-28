import { DOCUMENT } from '@angular/common';
import { Signal, inject, signal } from '@angular/core';

export interface ChartColours {
  readonly brand: string;
  readonly accent: string;
  readonly positive: string;
  readonly caution: string;
  readonly negative: string;
  readonly content: string;
  readonly muted: string;
  readonly border: string;
}

const TOKENS: Readonly<Record<keyof ChartColours, string>> = {
  brand: '--lw-brand',
  accent: '--lw-accent',
  positive: '--lw-positive',
  caution: '--lw-caution',
  negative: '--lw-negative',
  content: '--lw-content',
  muted: '--lw-content-muted',
  border: '--lw-border',
};

export function chartColours(): Signal<ChartColours> {
  const document = inject(DOCUMENT);
  const root = document.documentElement;
  const colours = signal(read(root));
  const observer = new MutationObserver(() => colours.set(read(root)));
  observer.observe(root, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-look'],
  });
  return colours.asReadonly();
}

function read(root: HTMLElement): ChartColours {
  const styles = getComputedStyle(root);
  const value = (token: string) => styles.getPropertyValue(token).trim();
  return Object.fromEntries(
    Object.entries(TOKENS).map(([key, token]) => [key, value(token)]),
  ) as unknown as ChartColours;
}
