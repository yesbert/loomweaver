import { Component, ElementRef, afterNextRender, effect, input, viewChild } from '@angular/core';
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
  template: '<canvas #canvas class="h-full w-full"></canvas>',
})
export class InsightsChart {
  readonly config = input.required<ChartConfiguration>();

  private readonly canvas =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private chart: Chart | undefined;
  private ready = false;

  constructor() {
    afterNextRender(() => {
      this.ready = true;
      this.render();
    });
    effect(() => {
      this.config();
      this.render();
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
