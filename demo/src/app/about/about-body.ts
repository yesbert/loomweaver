import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { PRODUCT_IDENTITY } from '@loomweaver/plugin-sdk';
import { VersionService } from '@loomweaver/shell';

export const DOCUMENTATION_URL = 'https://loomweaver.dev/';

@Component({
  selector: 'demo-about-body',
  imports: [TranslocoPipe],
  templateUrl: './about-body.html',
})
export class AboutBody {
  protected readonly identity = inject(PRODUCT_IDENTITY);
  protected readonly version = inject(VersionService).version;
  protected readonly documentationUrl = DOCUMENTATION_URL;
}
