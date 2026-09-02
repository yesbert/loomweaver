import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  DoughnutController,
  LinearScale,
  Tooltip,
} from 'chart.js';

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  LinearScale,
  Tooltip,
);

@Component({
  selector: 'lw-insights-chart',
  host: { class: 'block h-full w-full min-w-0' },
  template: '<canvas #canvas></canvas>',
})
export class InsightsChart {
  readonly config = input.required<ChartConfiguration>();

  private readonly canvas =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private chart: Chart | undefined;
  private ready = false;
  private sizes: ResizeObserver | undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.ready = true;
      this.render();
      this.sizes = new ResizeObserver(() => this.chart?.resize());
      this.sizes.observe(this.host.nativeElement);
    });

    effect(() => {
      this.config();
      this.render();
    });

    destroyRef.onDestroy(() => {
      this.sizes?.disconnect();
      this.chart?.destroy();
    });
  }

  private render(): void {
    if (!this.ready) {
      return;
    }
    this.chart?.destroy();
    this.chart = new Chart(this.canvas().nativeElement, this.config());
  }
}
