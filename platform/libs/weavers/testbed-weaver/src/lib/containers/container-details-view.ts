import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { containerIdFromRoute } from './container-id';

@Component({
  selector: 'lw-testbed-container-details-view',
  imports: [TranslocoPipe],
  templateUrl: './container-details-view.html',
})
export class ContainerDetailsView {

  protected readonly containerId = containerIdFromRoute();
  protected readonly itemCount = this.containerId.length * 4;
  protected readonly stepCount = this.containerId.length * 128;
}
