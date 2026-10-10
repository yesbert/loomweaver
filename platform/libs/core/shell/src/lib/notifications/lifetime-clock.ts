interface RunningLifetime {
  readonly timer: ReturnType<typeof setTimeout>;
  readonly endsAt: number;
}

export class LifetimeClock {
  private readonly running = new Map<string, RunningLifetime>();
  private readonly paused = new Map<string, number>();
  private held = false;

  constructor(private readonly elapsed: (id: string) => void) {}

  counts(id: string): boolean {
    return this.running.has(id) || this.paused.has(id);
  }

  start(id: string, lifetimeMs: number): void {
    this.stop(id);
    if (this.held) {
      this.paused.set(id, lifetimeMs);
      return;
    }
    this.run(id, lifetimeMs);
  }

  stop(id: string): void {
    clearTimeout(this.running.get(id)?.timer);
    this.running.delete(id);
    this.paused.delete(id);
  }

  hold(): void {
    if (this.held) {
      return;
    }
    this.held = true;
    const now = Date.now();
    for (const [id, { timer, endsAt }] of this.running) {
      clearTimeout(timer);
      this.paused.set(id, Math.max(endsAt - now, 0));
    }
    this.running.clear();
  }

  release(atLeastMs: number): void {
    if (!this.held) {
      return;
    }
    this.held = false;
    const paused = [...this.paused];
    this.paused.clear();
    for (const [id, remainingMs] of paused) {
      this.run(id, Math.max(remainingMs, atLeastMs));
    }
  }

  private run(id: string, lifetimeMs: number): void {
    const timer = setTimeout(() => {
      this.running.delete(id);
      this.elapsed(id);
    }, lifetimeMs);
    this.running.set(id, { timer, endsAt: Date.now() + lifetimeMs });
  }
}
