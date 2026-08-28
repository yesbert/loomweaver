import { inject } from '@angular/core';
import { KeyValueStore } from './key-value-store';
import { StateSyncChannel } from './state-sync-channel';

export class CrossTabSyncStore implements KeyValueStore {
  peek?: (key: string) => string | undefined;

  private readonly inner: KeyValueStore;
  private readonly channel: StateSyncChannel;

  constructor(inner: KeyValueStore, channel: StateSyncChannel) {
    this.inner = inner;
    this.channel = channel;
    const innerPeek = inner.peek?.bind(inner);
    if (innerPeek) {
      this.peek = innerPeek;
    }
  }

  get(key: string): Promise<string | undefined> {
    return this.inner.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.inner.set(key, value);
    } catch {
      return;
    }
    this.channel.post(key);
  }

  async delete(key: string): Promise<void> {
    try {
      await this.inner.delete(key);
    } catch {
      return;
    }
    this.channel.post(key);
  }
}

export function withCrossTabSync(inner: KeyValueStore): KeyValueStore {
  return new CrossTabSyncStore(inner, inject(StateSyncChannel));
}
