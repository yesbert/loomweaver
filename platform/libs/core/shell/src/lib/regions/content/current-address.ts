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

  readonly url: Signal<string> = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly showsContent: Signal<boolean> = computed(() => {
    this.url();
    const shown = this.router.routerState.snapshot.root.firstChild;
    return shown === null || shown.routeConfig?.data?.['content'] === true;
  });

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
