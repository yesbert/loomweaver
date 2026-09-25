import { Service } from '@angular/core';

interface KeyChangeMessage {
  readonly sender: string;
  readonly key: string;
}

const CHANNEL_NAME = 'lw.state-sync';

@Service()
export class StateSyncChannel {
  private readonly sender = crypto.randomUUID();
  private readonly listeners = new Set<(key: string) => void>();
  private channel: BroadcastChannel | null | undefined;
  private applying = false;

  post(key: string): void {
    if (this.applying) {
      return;
    }
    this.open()?.postMessage({ sender: this.sender, key });
  }

  listen(listener: (key: string) => void): void {
    this.open();
    this.listeners.add(listener);
  }

  whileApplying(apply: () => void): void {
    this.applying = true;
    try {
      apply();
    } finally {
      this.applying = false;
    }
  }

  private open(): BroadcastChannel | null {
    if (this.channel !== undefined) {
      return this.channel;
    }
    this.channel = this.create();
    return this.channel;
  }

  private create(): BroadcastChannel | null {
    if (typeof BroadcastChannel === 'undefined') {
      return null;
    }
    try {
      const opened = new BroadcastChannel(CHANNEL_NAME);
      opened.addEventListener('message', (event: MessageEvent) =>
        this.receive(event.data),
      );
      return opened;
    } catch {
      return null;
    }
  }

  private receive(data: unknown): void {
    const message = data as Partial<KeyChangeMessage> | null;
    if (
      !message ||
      typeof message.key !== 'string' ||
      message.sender === this.sender
    ) {
      return;
    }
    for (const listener of this.listeners) {
      listener(message.key);
    }
  }
}
