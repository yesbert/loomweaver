import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { containerIdFromRoute } from './container-id';

@Component({
  selector: 'lw-testbed-container-audit-view',
  imports: [TranslocoPipe],
  templateUrl: './container-audit-view.html',
})
export class ContainerAuditView {

  protected readonly containerId = containerIdFromRoute();
}
