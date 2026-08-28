import { signal } from '@angular/core';

export interface ChatLine {
  readonly kind: 'visitor' | 'note' | 'agent' | 'call' | 'result';
  readonly text: string;
  readonly args?: string;
  readonly failed?: boolean;
}

const lines = signal<readonly ChatLine[]>([]);
const running = signal(false);

export const conversation = {
  lines: lines.asReadonly(),
  running: running.asReadonly(),
  begin(): boolean {
    if (running()) {
      return false;
    }
    running.set(true);
    return true;
  },
  end(): void {
    running.set(false);
  },
  push(line: ChatLine): void {
    lines.update((all) => [...all, line]);
  },
  grow(field: 'text' | 'args', delta: string): void {
    lines.update((all) => {
      const last = all[all.length - 1];
      return [...all.slice(0, -1), { ...last, [field]: `${last[field] ?? ''}${delta}` }];
    });
  },
};
