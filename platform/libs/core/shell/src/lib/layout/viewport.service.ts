import { DOCUMENT } from '@angular/common';
import { inject, Service, signal, Signal } from '@angular/core';

const COMPACT_QUERY = '(max-width: 767.98px)';

@Service()
export class ViewportService {
  private readonly document = inject(DOCUMENT);

  readonly compact: Signal<boolean> = this.watchCompact();

  private watchCompact(): Signal<boolean> {
    const query = this.document.defaultView?.matchMedia?.(COMPACT_QUERY);
    const compact = signal(query?.matches ?? false);
    query?.addEventListener('change', (event) => compact.set(event.matches));
    return compact.asReadonly();
  }
}
