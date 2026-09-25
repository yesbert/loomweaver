import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { containerIdFromRoute } from './container-id';

@Component({
  selector: 'lw-testbed-container-canvas-view',
  imports: [TranslocoPipe],
  templateUrl: './container-canvas-view.html',
})
export class ContainerCanvasView {

  protected readonly containerId = containerIdFromRoute();
  protected readonly nodes = Array.from(
    { length: 6 },
    (_, index) => `${this.containerId}-${index + 1}`,
  );
}
