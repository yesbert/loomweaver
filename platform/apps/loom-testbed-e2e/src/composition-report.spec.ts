import { expect, test } from '@playwright/test';

test.describe('The dev-mode composition report (K7)', () => {
  test('is reachable from the console and finds nothing wrong with this distribution', async ({
    page,
  }) => {
    const lines: string[] = [];
    page.on('console', (message) => lines.push(message.text()));
    await page.goto('/');

    await expect
      .poll(() => page.evaluate(() => typeof window['loomweaver']?.report))
      .toBe('function');

    lines.length = 0;
    await page.evaluate(() => window['loomweaver'].report());

    await expect
      .poll(() => lines.join('\n'))
      .toContain('LoomWeaver composition');
    const printed = lines.join('\n');
    expect(printed).toContain('main (content/center)');
    expect(printed).toContain('No problems found.');
    expect(printed).not.toContain('matched nothing');
  });
});
