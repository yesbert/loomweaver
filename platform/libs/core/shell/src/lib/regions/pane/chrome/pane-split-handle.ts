import { Component, ElementRef, computed, inject, input, output } from '@angular/core';
import { MAX_RATIO, MIN_RATIO } from '../tree/pane-ratio';

const STEP = 0.02;
const STEP_COARSE = 0.1;

@Component({
  selector: 'lw-pane-split-handle',
  template: '',
  host: {
    class:
      'relative shrink-0 touch-none bg-border transition-colors hover:bg-brand focus-visible:bg-brand focus-visible:outline-none',
    '[class]': 'axisClass()',
    role: 'separator',
    '[attr.aria-orientation]': "isRow() ? 'vertical' : 'horizontal'",
    tabindex: '0',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuenow]': 'valueNow()',
    '[attr.aria-valuemin]': 'valueMin',
    '[attr.aria-valuemax]': 'valueMax',
    '(pointerdown)': 'onPointerDown($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class PaneSplitHandle {
  readonly ratio = input.required<number>();

  readonly orientation = input<'row' | 'column'>('row');

  readonly label = input('');

  readonly ratioStream = output<number>();

  readonly ratioCommit = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly isRow = computed(() => this.orientation() === 'row');

  protected readonly valueNow = computed(() => Math.round(this.ratio() * 100));

  protected readonly valueMin = Math.round(MIN_RATIO * 100);

  protected readonly valueMax = Math.round(MAX_RATIO * 100);

  protected readonly axisClass = computed(() =>
    this.isRow() ? 'w-1.5 cursor-col-resize' : 'h-1.5 w-full cursor-row-resize',
  );

  protected onPointerDown(event: PointerEvent): void {
    const parent = this.host.nativeElement.parentElement;
    if (!parent) {
      return;
    }
    const rect = parent.getBoundingClientRect();
    const el = this.host.nativeElement;
    el.setPointerCapture(event.pointerId);
    event.preventDefault();
    const move = (e: PointerEvent) =>
      this.ratioStream.emit(this.fraction(e, rect));
    const up = (e: PointerEvent) => {
      el.releasePointerCapture(e.pointerId);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      this.ratioCommit.emit();
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const step = event.shiftKey ? STEP_COARSE : STEP;
    const decrease = this.isRow() ? 'ArrowLeft' : 'ArrowUp';
    const increase = this.isRow() ? 'ArrowRight' : 'ArrowDown';
    if (event.key === decrease) {
      this.ratioStream.emit(this.ratio() - step);
      this.ratioCommit.emit();
      event.preventDefault();
    } else if (event.key === increase) {
      this.ratioStream.emit(this.ratio() + step);
      this.ratioCommit.emit();
      event.preventDefault();
    }
  }

  private fraction(event: PointerEvent, rect: DOMRect): number {
    return this.isRow()
      ? (event.clientX - rect.left) / rect.width
      : (event.clientY - rect.top) / rect.height;
  }
}
