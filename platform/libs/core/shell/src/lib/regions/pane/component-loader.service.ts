import { Service, signal, Type, WritableSignal } from '@angular/core';

export interface LazyComponentSource {
  readonly component?: Type<unknown>;
  readonly loadComponent?: () => Promise<Type<unknown>>;
}

@Service()
export class ComponentLoader {
  private readonly byLoader = new Map<
    () => Promise<Type<unknown>>,
    WritableSignal<Type<unknown> | null>
  >();

  private readonly failures = signal<ReadonlySet<() => Promise<Type<unknown>>>>(
    new Set(),
  );

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
    void loader().then(
      (component) => resolved.set(component),
      (error: unknown) => {
        console.error('[loom] surface failed to load', error);
        this.failures.update((failed) => new Set(failed).add(loader));
      },
    );
    return resolved();
  }

  failed(source: LazyComponentSource): boolean {
    const loader = source.loadComponent;
    return loader !== undefined && this.failures().has(loader);
  }
}
