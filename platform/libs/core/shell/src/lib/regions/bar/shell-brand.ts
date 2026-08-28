import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { PRODUCT_IDENTITY } from '@loomweaver/plugin-sdk';

@Component({
  selector: 'lw-shell-brand',
  imports: [TranslocoPipe],
  templateUrl: './shell-brand.html',
})
export class ShellBrand {
  protected readonly product = inject(PRODUCT_IDENTITY);
}
