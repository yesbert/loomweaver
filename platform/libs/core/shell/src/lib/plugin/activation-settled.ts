import { Service } from '@angular/core';

@Service()
export class ActivationSettled {
  private readonly pending = new Set<Promise<void>>();

  track(work: Promise<unknown>): void {
    const settled: Promise<void> = work
      .then(
        () => undefined,
        () => undefined,
      )
      .finally(() => this.pending.delete(settled));
    this.pending.add(settled);
  }

  isPending(): boolean {
    return this.pending.size > 0;
  }

  async settled(): Promise<void> {
    while (this.isPending()) {
      await Promise.all(this.pending);
    }
  }
}
