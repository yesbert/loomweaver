import { Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { PanelSizeService } from './panel-size.service';

const STEP = 16;
const STEP_COARSE = 48;

@Component({
  selector: 'lw-panel-splitter',
  imports: [TranslocoPipe],
  templateUrl: './panel-splitter.html',
})
export class PanelSplitter {
  readonly regionId = input.required<string>();
  readonly dock = input.required<'left' | 'right'>();

  protected readonly size = inject(PanelSizeService);
  protected readonly width = computed(() => this.size.width(this.regionId()));

  private dragging = false;
  private startX = 0;
  private startWidth = 0;

  protected onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    this.dragging = true;
    this.startX = event.clientX;
    this.startWidth = this.size.width(this.regionId());
    this.size.beginResize();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }

    const delta = event.clientX - this.startX;
    this.size.setWidth(
      this.regionId(),
      this.startWidth + this.edgeSign() * delta,
    );
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    this.size.endResize();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const step = (event.shiftKey ? STEP_COARSE : STEP) * this.edgeSign();
    let next: number;
    switch (event.key) {
      case 'ArrowRight': {
        next = this.width() + step;
        break;
      }
      case 'ArrowLeft': {
        next = this.width() - step;
        break;
      }
      case 'Home': {
        next = this.size.minWidth;
        break;
      }
      case 'End': {
        next = this.size.maxWidth;
        break;
      }
      default: {
        return;
      }
    }
    event.preventDefault();
    this.size.setWidth(this.regionId(), next);
    this.size.commit();
  }

  private edgeSign(): number {
    return this.dock() === 'left' ? 1 : -1;
  }
}
