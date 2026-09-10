import { Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { PRODUCT_IDENTITY } from '@loomweaver/plugin-sdk';
import { ViewportService } from '../../layout/viewport.service';

/**
 * The product's identity as the workbench's own frame draws it: the mark, the name in the brand
 * colour and the tagline. Embeddable anywhere a distribution wants the same block — an about dialog
 * is the usual place — so that a product does not keep a copy of it. Reads the identity supplied
 * through `provideProductIdentity`.
 *
 * `compact` pins the narrow form, in which the mark stands for the product alone; left unset the
 * form follows the width of the frame, exactly as it does in the top bar.
 */
@Component({
  selector: 'lw-shell-brand',
  imports: [TranslocoPipe],
  templateUrl: './shell-brand.html',
})
export class ShellBrand {
  readonly compact = input<boolean | undefined>(undefined);

  protected readonly product = inject(PRODUCT_IDENTITY);

  private readonly viewport = inject(ViewportService);

  protected readonly narrow = computed(
    () => this.compact() ?? this.viewport.compact(),
  );
}
