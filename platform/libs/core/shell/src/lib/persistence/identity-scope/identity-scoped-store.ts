import { KeyValueStore } from '../key-value-store';
import { peekThrough } from '../peek-through';
import { BootLatchedIdentity } from './boot-latched-identity';

export class IdentityScopedStore implements KeyValueStore {
  peek?: (key: string) => string | undefined;

  private readonly inner: KeyValueStore;
  private readonly latch: BootLatchedIdentity;
  private readonly deviceKeys: ReadonlySet<string>;
  private readonly built = new Map<string, string | undefined>();
  private readonly arrived = new Map<string, string | undefined>();
  private readonly inherited = new Map<string, string>();
  private readonly heldWhileNobodyWasKnown = new Map<
    string,
    string | undefined
  >();
  private namespaceRead = false;
  private givenUp = false;
  private copying: Promise<unknown> = Promise.resolve();
  private readonly copiedFromNobody = new Set<string>();

  constructor(
    inner: KeyValueStore,
    latch: BootLatchedIdentity,
    deviceKeys: ReadonlySet<string>,
  ) {
    this.inner = inner;
    this.latch = latch;
    this.deviceKeys = deviceKeys;
    const peek = peekThrough(inner);
    this.peek = peek && ((key) => this.peekHeld(peek, key));
  }

  async get(key: string): Promise<string | undefined> {
    const asked = this.scoped(key);
    const answer = this.withHeld(asked, await this.inner.get(asked));
    this.remember(key, asked, answer);
    const adopted = this.scoped(key);
    if (adopted !== asked) {
      return this.withHeld(adopted, await this.inner.get(adopted)) ?? answer;
    }
    if (answer !== undefined || !this.inherits(key, asked)) {
      return answer;
    }
    return this.inherit(key, asked);
  }

  set(key: string, value: string): Promise<void> {
    return this.write(key, value);
  }

  delete(key: string): Promise<void> {
    return this.write(key, undefined);
  }

  async writeWhereTheNamespaceIsEmpty(): Promise<void> {
    if (this.givenUp) {
      return;
    }
    this.namespaceRead = true;
    try {
      for (const held of [this.built, this.inherited]) {
        for (const [scoped, value] of held) {
          if (value === undefined) {
            continue;
          }
          const stored = await this.inner.get(scoped);
          if (this.givenUp) {
            return;
          }
          if (stored === undefined) {
            await this.copy(scoped, value, held === this.inherited);
          }
        }
      }
    } finally {
      this.built.clear();
      this.inherited.clear();
      this.heldWhileNobodyWasKnown.clear();
    }
  }

  async writeWhatArrivedDuringAdoption(): Promise<void> {
    this.copiedFromNobody.clear();
    const arrived = [...this.arrived];
    this.arrived.clear();
    for (const [scoped, value] of arrived) {
      await (value === undefined
        ? this.inner.delete(scoped)
        : this.inner.set(scoped, value));
    }
  }

  async writeWhatWasHeldWithoutAdopting(): Promise<void> {
    this.givenUp = true;
    this.namespaceRead = true;
    for (const [scoped, value] of this.built) {
      if (!this.arrived.has(scoped)) {
        this.arrived.set(scoped, value);
      }
    }
    this.built.clear();
    this.inherited.clear();
    this.heldWhileNobodyWasKnown.clear();
    await this.copying;
    await this.undoCopiesFromNobody();
    await this.writeWhatArrivedDuringAdoption();
  }

  private copy(scoped: string, value: string, fromNobody: boolean): Promise<void> {
    const copied = this.inner.set(scoped, value).then(() => {
      if (fromNobody) {
        this.copiedFromNobody.add(scoped);
      }
    });
    this.copying = copied.catch(() => undefined);
    return copied;
  }

  private async undoCopiesFromNobody(): Promise<void> {
    const copied = [...this.copiedFromNobody];
    this.copiedFromNobody.clear();
    for (const scoped of copied) {
      if (!this.arrived.has(scoped)) {
        await this.inner.delete(scoped);
      }
    }
  }

  private write(key: string, value: string | undefined): Promise<void> {
    const scoped = this.scoped(key);
    this.remember(key, scoped, value);
    this.copiedFromNobody.delete(scoped);
    if (this.held(key)) {
      this.inherited.delete(scoped);
      (this.namespaceRead ? this.arrived : this.built).set(scoped, value);
      return Promise.resolve();
    }
    return value === undefined
      ? this.inner.delete(scoped)
      : this.inner.set(scoped, value);
  }

  private peekHeld(
    peek: (key: string) => string | undefined,
    key: string,
  ): string | undefined {
    const scoped = this.scoped(key);
    const answer = this.withHeld(scoped, peek(scoped));
    this.remember(key, scoped, answer);
    if (answer !== undefined || !this.inherits(key, scoped)) {
      return answer;
    }
    return this.inherit(key, scoped);
  }

  private withHeld(
    scoped: string,
    stored: string | undefined,
  ): string | undefined {
    if (this.arrived.has(scoped)) {
      return this.arrived.get(scoped);
    }
    return stored ?? this.built.get(scoped) ?? this.inherited.get(scoped);
  }

  private inherits(key: string, scoped: string): boolean {
    return this.held(key) && !this.namespaceRead && !this.built.has(scoped);
  }

  private remember(
    key: string,
    scoped: string,
    value: string | undefined,
  ): void {
    if (scoped === key && !this.deviceKeys.has(key)) {
      this.heldWhileNobodyWasKnown.set(key, value);
    }
  }

  private inherit(key: string, scoped: string): string | undefined {
    const anonymous = this.heldWhileNobodyWasKnown.get(key);
    if (anonymous !== undefined) {
      this.inherited.set(scoped, anonymous);
    }
    return anonymous;
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
