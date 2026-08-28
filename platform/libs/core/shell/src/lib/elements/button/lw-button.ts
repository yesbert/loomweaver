import { Directive, booleanAttribute, computed, input } from '@angular/core';
import { LwButtonVariant, LwButtonSize } from '@loomweaver/plugin-sdk';
import { lwButtonClasses } from './lw-button-classes';

export type { LwButtonVariant, LwButtonSize } from '@loomweaver/plugin-sdk';

/**
 * The neutral host button primitive. A directive on a real `<button>`/`<a>`, so it
 * keeps native semantics (type, disabled, focus, aria) and its own content — consumers just add
 * `lwButton` and pick a variant.
 *
 * The button LOOK is a CSS-class contract (`.lw-btn` in theme.css): this directive is
 * only a thin wrapper that emits those class names from typed inputs. So the very same look is
 * reachable by SDK-only plugins that cannot import this directive across the Nx boundary — they
 * write `<button class="lw-btn lw-btn--primary">`. One source of truth, all on semantic tokens,
 * so a theme / tenant override reaches host and plugin buttons alike.
 *
 *   <button lwButton variant="primary" (click)="save()">Speichern</button>
 *   <button lwButton variant="ghost" size="sm" iconOnly aria-label="…"><lw-icon … /></button>
 */
@Directive({
  selector: 'button[lwButton], a[lwButton]',
  host: { '[class]': 'classes()' },
})
export class LwButton {
  /** Visual weight; defaults to `default`. */
  readonly variant = input<LwButtonVariant>('default');
  /** Size; defaults to `md`. */
  readonly size = input<LwButtonSize>('md');
  /** Square, equal-padding button for a single icon (needs its own `aria-label`). */
  readonly iconOnly = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() =>
    lwButtonClasses(this.variant(), this.size(), this.iconOnly()).join(' '),
  );
}
