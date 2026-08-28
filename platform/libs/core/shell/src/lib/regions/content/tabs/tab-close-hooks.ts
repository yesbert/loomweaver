import { Service } from '@angular/core';

@Service()
export class TabCloseHooks {
  private readonly hooks = new Map<string, () => void>();

  get(root: string): (() => void) | undefined {
    return this.hooks.get(root);
  }

  set(root: string, hook: (() => void) | undefined): void {
    if (hook) {
      this.hooks.set(root, hook);
    } else {
      this.hooks.delete(root);
    }
  }

  delete(root: string): void {
    this.hooks.delete(root);
  }

  take(root: string): (() => void) | undefined {
    const hook = this.hooks.get(root);
    this.hooks.delete(root);
    return hook;
  }

  runSafely(hook: (() => void) | undefined): void {
    if (!hook) {
      return;
    }
    try {
      hook();
    } catch (error) {
      console.error('Content tab onClose handler failed', error);
    }
  }
}
