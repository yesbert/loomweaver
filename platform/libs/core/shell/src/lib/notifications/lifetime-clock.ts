interface RunningLifetime {
  readonly timer: ReturnType<typeof setTimeout>;
  readonly endsAt: number;
}

export class LifetimeClock {
  private readonly running = new Map<number, RunningLifetime>();
  private readonly paused = new Map<number, number>();
  private isHeld = false;

  constructor(private readonly elapsed: (key: number) => void) {}

  isTiming(key: number): boolean {
    return this.running.has(key) || this.paused.has(key);
  }

  start(key: number, lifetimeMs: number): void {
    this.stop(key);
    if (this.isHeld) {
      this.paused.set(key, lifetimeMs);
      return;
    }
    this.run(key, lifetimeMs);
  }

  stop(key: number): void {
    clearTimeout(this.running.get(key)?.timer);
    this.running.delete(key);
    this.paused.delete(key);
  }

  hold(): void {
    if (this.isHeld) {
      return;
    }
    this.isHeld = true;
    const now = Date.now();
    for (const [key, { timer, endsAt }] of this.running) {
      clearTimeout(timer);
      this.paused.set(key, Math.max(endsAt - now, 0));
    }
    this.running.clear();
  }

  release(atLeastMs: number): void {
    if (!this.isHeld) {
      return;
    }
    this.isHeld = false;
    const paused = [...this.paused];
    this.paused.clear();
    for (const [key, remainingMs] of paused) {
      this.run(key, Math.max(remainingMs, atLeastMs));
    }
  }

  private run(key: number, lifetimeMs: number): void {
    const timer = setTimeout(() => {
      this.running.delete(key);
      this.elapsed(key);
    }, lifetimeMs);
    this.running.set(key, { timer, endsAt: Date.now() + lifetimeMs });
  }
}
