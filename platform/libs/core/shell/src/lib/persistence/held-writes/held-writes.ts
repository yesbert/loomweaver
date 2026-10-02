import { DOCUMENT } from '@angular/common';
import { inject, OnDestroy, Service } from '@angular/core';

const QUIET_MS = 400;
const LONGEST_WAIT_MS = 2000;

type Send = (value: string) => void;
type Timer = ReturnType<typeof setTimeout>;

interface Held {
  value: string;
  send: Send;
  quiet: Timer;
  readonly longest: Timer;
}

@Service()
export class HeldWrites implements OnDestroy {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly held = new Map<string, Held>();

  constructor() {
    this.window?.addEventListener('pagehide', this.flushAll);
  }

  ngOnDestroy(): void {
    this.window?.removeEventListener('pagehide', this.flushAll);
  }

  hold(key: string, value: string, send: Send): void {
    const existing = this.held.get(key);
    if (existing) {
      clearTimeout(existing.quiet);
      existing.value = value;
      existing.send = send;
      existing.quiet = this.flushAfter(key, QUIET_MS);
      return;
    }
    this.held.set(key, {
      value,
      send,
      quiet: this.flushAfter(key, QUIET_MS),
      longest: this.flushAfter(key, LONGEST_WAIT_MS),
    });
  }

  flush(key: string): void {
    const held = this.release(key);
    held?.send(held.value);
  }

  cancel(key: string): void {
    this.release(key);
  }

  private readonly flushAll = (): void => {
    for (const key of this.held.keys()) {
      this.flush(key);
    }
  };

  private flushAfter(key: string, wait: number): Timer {
    return setTimeout(() => this.flush(key), wait);
  }

  private release(key: string): Held | undefined {
    const held = this.held.get(key);
    if (!held) {
      return undefined;
    }
    clearTimeout(held.quiet);
    clearTimeout(held.longest);
    this.held.delete(key);
    return held;
  }
}
