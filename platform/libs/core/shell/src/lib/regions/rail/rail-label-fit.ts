import {
  afterEveryRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  signal,
} from '@angular/core';

@Directive()
export class RailLabelFit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly shortenedIds = signal<ReadonlySet<string>>(new Set());

  constructor() {
    afterEveryRender(() => this.measure());
    this.observeResize();
  }

  isShortened(itemId: string): boolean {
    return this.shortenedIds().has(itemId);
  }

  private measure(): void {
    const shortened = shortenedLabelIds(this.host.nativeElement);
    if (!sameIds(shortened, this.shortenedIds())) {
      this.shortenedIds.set(shortened);
    }
  }

  private observeResize(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => this.measure());
    observer.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}

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
