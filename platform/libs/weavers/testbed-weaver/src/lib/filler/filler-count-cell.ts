import { Component, inject } from '@angular/core';
import { TOOLBAR_CONTEXT } from '@loomweaver/plugin-sdk';

@Component({
  selector: 'lw-testbed-filler-count',
  templateUrl: './filler-count-cell.html',
})
export class FillerCountCell {
  protected readonly where = inject(TOOLBAR_CONTEXT);
}
