import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ChartConfiguration } from 'chart.js';
import { InsightsChart } from './insights-chart';

@Component({
  imports: [InsightsChart],
  template:
    '<demo-insights-chart [config]="config" labelledBy="quoted-heading" describedBy="quoted-values" />',
})
class Dashboard {
  protected readonly config: ChartConfiguration = {
    type: 'bar',
    data: { labels: [], datasets: [] },
  };
}

describe('InsightsChart', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {
          return undefined;
        }
        disconnect(): void {
          return undefined;
        }
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('tells assistive technology that the drawing is an image, named and described by what the card already says', () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();

    const canvas = (fixture.nativeElement as HTMLElement).querySelector('canvas');

    expect(canvas?.getAttribute('role')).toBe('img');
    expect(canvas?.getAttribute('aria-labelledby')).toBe('quoted-heading');
    expect(canvas?.getAttribute('aria-describedby')).toBe('quoted-values');
    expect(canvas?.hasAttribute('aria-label')).toBe(false);
  });
});
