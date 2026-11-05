import { KeyValueStore } from '../key-value-store';
import { peekThrough } from '../peek-through';
import { BootLatchedIdentity } from './boot-latched-identity';

export class IdentityScopedStore implements KeyValueStore {
  peek?: (key: string) => string | undefined;

  private readonly inner: KeyValueStore;
  private readonly latch: BootLatchedIdentity;
  private readonly deviceKeys: ReadonlySet<string>;
  private readonly built = new Map<string, string>();
  private readonly arrived = new Map<string, string>();
  private namespaceRead = false;

  constructor(
    inner: KeyValueStore,
    latch: BootLatchedIdentity,
    deviceKeys: ReadonlySet<string>,
  ) {
    this.inner = inner;
    this.latch = latch;
    this.deviceKeys = deviceKeys;
    this.peek = peekThrough(inner, (key) => this.scoped(key));
  }

  async get(key: string): Promise<string | undefined> {
    const asked = this.scoped(key);
    const answer = await this.read(asked);
    const adopted = this.scoped(key);
    if (adopted === asked) {
      return answer;
    }
    return (await this.read(adopted)) ?? answer;
  }

  set(key: string, value: string): Promise<void> {
    const scoped = this.scoped(key);
    if (this.held(key)) {
      this.withheld().set(scoped, value);
      return Promise.resolve();
    }
    return this.inner.set(scoped, value);
  }

  delete(key: string): Promise<void> {
    const scoped = this.scoped(key);
    if (this.held(key)) {
      this.withheld().delete(scoped);
      return Promise.resolve();
    }
    return this.inner.delete(scoped);
  }

  async writeWhereTheNamespaceIsEmpty(): Promise<void> {
    this.namespaceRead = true;
    try {
      for (const [scoped, value] of this.built) {
        if ((await this.inner.get(scoped)) === undefined) {
          await this.inner.set(scoped, value);
        }
      }
    } finally {
      this.built.clear();
    }
  }

  async writeWhatArrivedDuringAdoption(): Promise<void> {
    const arrived = [...this.arrived];
    this.arrived.clear();
    for (const [scoped, value] of arrived) {
      await this.inner.set(scoped, value);
    }
  }

  private async read(scoped: string): Promise<string | undefined> {
    const built = this.built.get(scoped);
    const stored = await this.inner.get(scoped);
    return this.arrived.get(scoped) ?? stored ?? built;
  }

  private withheld(): Map<string, string> {
    return this.namespaceRead ? this.arrived : this.built;
  }

  private held(key: string): boolean {
    return !this.deviceKeys.has(key) && this.latch.adopting();
  }

  private scoped(key: string): string {
    if (this.deviceKeys.has(key)) {
      return key;
    }
    this.latch.latch();
    const id = this.latch.current();
    if (id === null) {
      return key;
    }
    return `lw.id.${encodeURIComponent(id)}:${key}`;
  }
}
