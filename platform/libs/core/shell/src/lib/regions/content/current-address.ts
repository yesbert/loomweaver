import { Service, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Params, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { normalizePath } from './content-path';

export interface AddressParts {
  readonly path: string;
  readonly queryParams: Params;
  readonly fragment: string | null;
}

@Service()
export class CurrentAddress {
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly snapshot: Signal<AddressParts> = computed(() => {
    const url = this.url();
    const tree = this.router.parseUrl(url);
    return {
      path: normalizePath(url),
      queryParams: tree.queryParams,
      fragment: tree.fragment,
    };
  });
}
