import { KeyValueStore } from './key-value-store';

export class BootLatchedIdentity {
  private latched: string | null = null;
  private servedAnonymously = false;
  private adoption = false;
  private readonly watchers = new Set<() => void>();

  constructor(private readonly read: () => string | null | undefined) {}

  current(): string | null {
    if (this.latched !== null) {
      return this.latched;
    }
    const id = this.read();
    if (!id) {
      this.servedAnonymously = true;
      return null;
    }
    this.latched = id;
    this.adopt();
    return id;
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

export class IdentityScopedStore implements KeyValueStore {
  peek?: (key: string) => string | undefined;

  private readonly inner: KeyValueStore;
  private readonly latch: BootLatchedIdentity;
  private readonly deviceKeys: ReadonlySet<string>;
  private readonly withheld = new Map<string, string>();

  constructor(
    inner: KeyValueStore,
    latch: BootLatchedIdentity,
    deviceKeys: ReadonlySet<string>,
  ) {
    this.inner = inner;
    this.latch = latch;
    this.deviceKeys = deviceKeys;
    const innerPeek = inner.peek?.bind(inner);
    if (innerPeek) {
      this.peek = (key) => innerPeek(this.scoped(key));
    }
  }

  get(key: string): Promise<string | undefined> {
    return this.inner.get(this.scoped(key));
  }

  set(key: string, value: string): Promise<void> {
    const scoped = this.scoped(key);
    if (this.held(key)) {
      this.withheld.set(scoped, value);
      return Promise.resolve();
    }
    return this.inner.set(scoped, value);
  }

  delete(key: string): Promise<void> {
    const scoped = this.scoped(key);
    if (this.held(key)) {
      this.withheld.delete(scoped);
      return Promise.resolve();
    }
    return this.inner.delete(scoped);
  }

  async writeWhereTheNamespaceIsEmpty(): Promise<void> {
    const pending = [...this.withheld];
    this.withheld.clear();
    for (const [scoped, value] of pending) {
      if ((await this.inner.get(scoped)) === undefined) {
        await this.inner.set(scoped, value);
      }
    }
  }

  private held(key: string): boolean {
    return !this.deviceKeys.has(key) && this.latch.adopting();
  }

  private scoped(key: string): string {
    if (this.deviceKeys.has(key)) {
      return key;
    }
    const id = this.latch.current();
    if (id === null) {
      return key;
    }
    return `lw.id.${encodeURIComponent(id)}:${key}`;
  }
}
