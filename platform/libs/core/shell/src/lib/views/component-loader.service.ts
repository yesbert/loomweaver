import { Service, signal, Type, WritableSignal } from '@angular/core';

export interface LazyComponentSource {
  readonly component?: Type<unknown>;
  readonly loadComponent?: () => Promise<Type<unknown>>;
}

@Service()
export class ComponentLoader {
  private readonly pending = new Map<
    () => Promise<Type<unknown>>,
    WritableSignal<Type<unknown> | null>
  >();

  resolve(source: LazyComponentSource): Type<unknown> | null {
    if (source.component) {
      return source.component;
    }
    const loader = source.loadComponent;
    if (!loader) {
      return null;
    }
    const known = this.pending.get(loader);
    if (known) {
      return known();
    }
    const resolved = signal<Type<unknown> | null>(null);
    this.pending.set(loader, resolved);
    void loader().then(
      (component) => resolved.set(component),
      (error: unknown) => console.error('[loom] surface failed to load', error),
    );
    return resolved();
  }
}
