import { KeyValueStore } from './key-value-store';

export class BootLatchedIdentity {
  private latched: string | null = null;

  constructor(private readonly read: () => string | null | undefined) {}

  current(): string | null {
    if (this.latched !== null) {
      return this.latched;
    }
    const id = this.read();
    if (id === null || id === undefined || id === '') {
      return null;
    }
    this.latched = id;
    return id;
  }
}

export class IdentityScopedStore implements KeyValueStore {
  peek?: (key: string) => string | undefined;

  private readonly inner: KeyValueStore;
  private readonly latch: BootLatchedIdentity;
  private readonly deviceKeys: ReadonlySet<string>;

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
    return this.inner.set(this.scoped(key), value);
  }

  delete(key: string): Promise<void> {
    return this.inner.delete(this.scoped(key));
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
