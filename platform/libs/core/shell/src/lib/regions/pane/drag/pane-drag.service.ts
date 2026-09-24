import { computed, Service, signal, Signal } from '@angular/core';

@Service()
export class PaneDragService {
  private readonly draggedPath = signal<string | null>(null);
  private readonly zones = signal<readonly string[]>([]);
  private readonly strips = signal<readonly string[]>([]);

  readonly dragging: Signal<string | null> = this.draggedPath.asReadonly();

  readonly dropTargetIds = computed<readonly string[]>(() => [
    ...this.zones(),
    ...this.strips(),
  ]);

  start(path: string): void {
    this.draggedPath.set(path);
  }

  stop(): void {
    this.draggedPath.set(null);
  }

  registerZone(id: string): () => void {
    this.zones.update((ids) => [...ids, id]);
    return () => this.zones.update((ids) => withoutOne(ids, id));
  }

  registerStrip(id: string): () => void {
    this.strips.update((ids) => [...ids, id]);
    return () => this.strips.update((ids) => withoutOne(ids, id));
  }
}

function withoutOne(ids: readonly string[], id: string): readonly string[] {
  const at = ids.indexOf(id);
  return at === -1 ? ids : [...ids.slice(0, at), ...ids.slice(at + 1)];
}
