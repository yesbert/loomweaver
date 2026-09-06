import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { PRODUCT_IDENTITY } from '@loomweaver/plugin-sdk';
import { ViewportService } from '../../layout/viewport.service';

@Component({
  selector: 'lw-shell-brand',
  imports: [TranslocoPipe],
  templateUrl: './shell-brand.html',
})
export class ShellBrand {
  protected readonly product = inject(PRODUCT_IDENTITY);
  protected readonly compact = inject(ViewportService).compact;
}
