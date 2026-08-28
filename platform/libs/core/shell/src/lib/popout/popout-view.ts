import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { TranslocoService } from '@jsverse/transloco';
import { PRODUCT_IDENTITY } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { ContentSecondaryPane } from '../regions/content/content-secondary-pane';
import { paneLabelOf, resolveTitle } from '../regions/pane/drag/pane-label';
import { LocaleService } from '../i18n/locale.service';
import { popoutTargetFromUrl } from './popout-path';

@Component({
  selector: 'lw-popout-view',
  imports: [ContentSecondaryPane],
  templateUrl: './popout-view.html',
  host: { class: 'block h-full min-h-0' },
})
export class PopoutView {
  private readonly router = inject(Router);
  private readonly registry = inject(ContributionRegistry);
  private readonly transloco = inject(TranslocoService);
  private readonly locale = inject(LocaleService);
  private readonly product = inject(PRODUCT_IDENTITY);
  private readonly document = inject(DOCUMENT);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly target = computed(
    () => popoutTargetFromUrl(this.url()) ?? '',
  );

  private readonly translations = toSignal(this.transloco.events$, {
    initialValue: null,
  });

  constructor() {
    effect(() => {
      this.locale.lang();
      this.translations();
      const label = paneLabelOf(this.registry, this.target());
      const title = resolveTitle(label, (key) => this.transloco.translate(key));
      this.document.title = `${title} — ${this.product.name}`;
    });
  }
}
