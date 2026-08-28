import { Component, ViewEncapsulation, input } from '@angular/core';

/**
 * A small indeterminate spinner. Pure CSS ring on `currentColor`
 * (brand by default), sized via the `size` input. Used by the progress dialog and anywhere a
 * busy indicator is needed.
 *
 *   <lw-spinner />
 *   <lw-spinner size="1rem" [label]="'…' | transloco" />
 */
@Component({
  selector: 'lw-spinner',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './lw-spinner.html',
})
export class LwSpinner {
  /** CSS size of the spinner (width = height). */
  readonly size = input('1.5rem');
  /** Accessible label announced to screen readers — pass a translated string; empty = none. */
  readonly label = input('');
}
