import { StateHandle } from '@loomweaver/plugin-sdk';

interface Scratch {
  readonly note: string;
}

class TestbedScratch {
  private handle: StateHandle<Scratch> | null = null;

  bind(handle: StateHandle<Scratch>): void {
    this.handle = handle;
  }

  unbind(): void {
    this.handle?.dispose();
    this.handle = null;
  }

  note(): string {
    return this.handle?.loaded() ? (this.handle.value()?.note ?? '') : '';
  }

  write(note: string): void {
    this.handle?.set({ note });
  }
}

export const testbedScratch = new TestbedScratch();
