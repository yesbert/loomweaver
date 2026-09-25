import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { VersionService } from '@loomweaver/shell';

@Component({
  selector: 'demo-preview-badge',
  imports: [TranslocoPipe],
  templateUrl: './preview-badge.html',
})
export class PreviewBadge {
  protected readonly isPreview = inject(VersionService).isPreview;
}
