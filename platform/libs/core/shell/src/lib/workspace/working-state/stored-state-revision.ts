import { Service, signal } from '@angular/core';

@Service()
export class StoredStateRevision {
  private readonly revision = signal(0);

  readonly current = this.revision.asReadonly();

  advance(): void {
    this.revision.update((value) => value + 1);
  }
}
