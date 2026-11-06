import {
  afterNextRender,
  afterRenderEffect,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

const EDGE_TOLERANCE_PX = 1;

@Directive({ selector: '[lwStripOverflow]', exportAs: 'lwStripOverflow' })
export class StripOverflow {
  readonly enabled = input(false, { alias: 'lwStripOverflow' });
  readonly active = input.required<string>({
    alias: 'lwStripOverflowActive',
  });
  readonly tabs = input<readonly unknown[]>([], {
    alias: 'lwStripOverflowTabs',
  });
  readonly reorderable = input(false, {
    alias: 'lwStripOverflowReorderable',
  });

  readonly revealRequest = output<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly overflowingState = signal(false);
  private pickedHere: string | null = null;

  readonly overflowing = this.overflowingState.asReadonly();

  constructor() {
    afterRenderEffect(() => {
      this.tabs();
      if (this.enabled()) {
        this.measure();
      }
    });
    afterNextRender(() => this.observeResize());
    afterRenderEffect(() => {
      const active = this.active();
      const picked = this.pickedHere;
      this.pickedHere = null;
      if (picked !== active && this.enabled()) {
        this.revealActiveTab();
      }
    });
  }

  notePicked(path: string): void {
    if (path !== this.active()) {
      this.pickedHere = path;
    }
  }

  forgetPicked(path: string): void {
    if (this.pickedHere === path) {
      this.pickedHere = null;
    }
  }

  private observeResize(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => this.enabled() && this.measure());
    observer.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private measure(): void {
    const element = this.host.nativeElement;
    this.overflowingState.set(
      element.scrollWidth - element.clientWidth > EDGE_TOLERANCE_PX,
    );
  }

  private revealActiveTab(): void {
    const strip = this.host.nativeElement;
    const active = this.active();
    const wrapper = strip.querySelector<HTMLElement>(
      `[data-tab-path="${CSS.escape(active)}"]`,
    )?.parentElement;
    if (!wrapper) {
      return;
    }
    const band = strip.getBoundingClientRect();
    const tab = wrapper.getBoundingClientRect();
    const fullyVisible =
      tab.left >= band.left - EDGE_TOLERANCE_PX &&
      tab.right <= band.right + EDGE_TOLERANCE_PX;
    if (fullyVisible) {
      return;
    }
    if (this.reorderable()) {
      this.revealRequest.emit(active);
      return;
    }
    strip.scrollLeft += this.shiftToShow(band, tab);
  }

  private shiftToShow(band: DOMRect, tab: DOMRect): number {
    return tab.left < band.left || tab.width > band.width
      ? tab.left - band.left
      : tab.right - band.right;
  }
}
