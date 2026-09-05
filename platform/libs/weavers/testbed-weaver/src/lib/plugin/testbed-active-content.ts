import { ActiveContent } from '@loomweaver/plugin-sdk';

class TestbedActiveContent {
  private read: (() => ActiveContent | null) | null = null;

  bind(read: () => ActiveContent | null): void {
    this.read = read;
  }

  unbind(): void {
    this.read = null;
  }

  path(): string {
    return this.read?.()?.path ?? '';
  }

  summary(): string {
    const active = this.read?.() ?? null;
    if (active === null) {
      return 'none';
    }
    const label = active.surfaceId ?? active.path;
    const params = Object.entries(active.params)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');
    return params ? `${label} (${params})` : label;
  }
}

export const testbedActiveContent = new TestbedActiveContent();
