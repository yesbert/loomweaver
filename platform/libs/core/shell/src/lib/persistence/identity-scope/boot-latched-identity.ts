export class BootLatchedIdentity {
  private latched: string | null = null;
  private servedAnonymously = false;
  private adoption = false;
  private readonly watchers = new Set<() => void>();

  constructor(private readonly read: () => string | null | undefined) {}

  latch(): void {
    if (this.latched !== null) {
      return;
    }
    const id = this.read();
    if (!id) {
      this.servedAnonymously = true;
      return;
    }
    this.latched = id;
    this.adopt();
  }

  current(): string | null {
    return this.latched;
  }

  adopting(): boolean {
    return this.adoption;
  }

  settle(): void {
    this.adoption = false;
  }

  watchAdoption(watcher: () => void): void {
    this.watchers.add(watcher);
  }

  private adopt(): void {
    if (!this.servedAnonymously || this.watchers.size === 0) {
      return;
    }
    this.adoption = true;
    for (const watcher of this.watchers) {
      watcher();
    }
  }
}
