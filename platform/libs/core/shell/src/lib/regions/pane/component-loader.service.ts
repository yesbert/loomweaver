import {
  Service,
  signal,
  Type,
  untracked,
  WritableSignal,
} from '@angular/core';

type Loader = () => Promise<Type<unknown>>;

export interface LazyComponentSource {
  readonly component?: Type<unknown>;
  readonly loadComponent?: () => Promise<Type<unknown>>;
}

@Service()
export class ComponentLoader {
  private readonly byLoader = new Map<
    Loader,
    WritableSignal<Type<unknown> | null>
  >();

  private readonly failures = signal<ReadonlySet<Loader>>(new Set());

  resolve(source: LazyComponentSource): Type<unknown> | null {
    if (source.component) {
      return source.component;
    }
    const loader = source.loadComponent;
    if (!loader) {
      return null;
    }
    const known = this.byLoader.get(loader);
    if (known) {
      return known();
    }
    const resolved = signal<Type<unknown> | null>(null);
    this.byLoader.set(loader, resolved);
    this.load(loader, resolved);
    return resolved();
  }

  failed(source: LazyComponentSource): boolean {
    const loader = source.loadComponent;
    return loader !== undefined && this.failures().has(loader);
  }

  retry(source: LazyComponentSource): void {
    const loader = source.loadComponent;
    const resolved = loader && this.byLoader.get(loader);
    if (!loader || !resolved || !untracked(this.failures).has(loader)) {
      return;
    }
    this.failures.update(
      (failed) => new Set([...failed].filter((each) => each !== loader)),
    );
    this.load(loader, resolved);
  }

  private load(
    loader: Loader,
    resolved: WritableSignal<Type<unknown> | null>,
  ): void {
    void loader().then(
      (component) => resolved.set(component),
      (error: unknown) => {
        console.error('[loom] surface failed to load', error);
        this.failures.update((failed) => new Set(failed).add(loader));
      },
    );
  }
}
