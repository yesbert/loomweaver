import { Frame, Page, expect, test } from '@playwright/test';

interface DrawnSurface {
  readonly origin: string;
  readonly image: string;
  readonly width: number;
  readonly height: number;
}

async function sandboxFrame(page: Page): Promise<Frame> {
  await page.goto('/sandbox-static');
  const element = page.locator('iframe[src*="/sandbox-static/view.html"]');
  await expect(element).toBeAttached({ timeout: 20_000 });
  const frame = await element.elementHandle().then((handle) => handle?.contentFrame());
  if (!frame) {
    throw new Error('the sandboxed surface never attached a document');
  }
  await frame.waitForFunction(() => 'LwFrame' in globalThis, undefined, {
    timeout: 20_000,
  });
  return frame;
}

test.describe('An isolated surface can draw itself', () => {
  test('it answers with its own content, from an origin it does not have', async ({
    page,
  }) => {
    const frame = await sandboxFrame(page);

    const drawn = await frame.evaluate<DrawnSurface>(async () => {
      const api = (globalThis as Record<string, unknown>)['LwFrame'] as {
        capture(request?: { scale?: number }): Promise<{
          image: string;
          width: number;
          height: number;
        }>;
      };
      const capture = await api.capture({ scale: 1 });
      return { origin: String(globalThis.origin), ...capture };
    });

    expect(drawn.origin).toBe('null');
    expect(drawn.image).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
    expect(drawn.width).toBeGreaterThan(0);
    expect(drawn.height).toBeGreaterThan(0);
    expect(drawn.image.length).toBeGreaterThan(1000);
  });

  test('the renderer arrives from beside the bundle, and only once asked for', async ({
    page,
  }) => {
    const requested: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('snapdom.global.js')) {
        requested.push(request.url());
      }
    });

    const frame = await sandboxFrame(page);
    expect(requested).toHaveLength(0);

    await frame.evaluate(async () => {
      const api = (globalThis as Record<string, unknown>)['LwFrame'] as {
        capture(request?: { scale?: number }): Promise<unknown>;
      };
      await api.capture({ scale: 1 });
      await api.capture({ scale: 1 });
    });

    expect(requested).toHaveLength(1);
    expect(requested[0]).toContain('/frame-kit/snapdom.global.js');
  });

  test('it draws the same surface at the scale it was asked for', async ({
    page,
  }) => {
    const frame = await sandboxFrame(page);

    const [single, double] = await frame.evaluate(async () => {
      const api = (globalThis as Record<string, unknown>)['LwFrame'] as {
        capture(request?: { scale?: number }): Promise<{
          width: number;
          height: number;
        }>;
      };
      return [await api.capture({ scale: 1 }), await api.capture({ scale: 2 })];
    });

    expect(double.width).toBeGreaterThan(single.width);
    expect(double.height).toBeGreaterThan(single.height);
  });
});
