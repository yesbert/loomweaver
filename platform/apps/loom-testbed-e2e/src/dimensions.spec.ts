import { expect, test } from '@playwright/test';

test.describe('Dimensions: unlayered product CSS beats every layered shell rule', () => {
  const sizes = () =>
    ({
      radius: '.lw-icon-btn',
      height: '.lw-icon-btn',
      strip: '.lw-segmented',
      rail: 'lw-shell-rail nav',
    }) as const;

  test('unlayered CSS overrides a class contract and a structural element alike', async ({
    page,
  }) => {
    await page.goto('/');
    const selectors = sizes();

    const read = () =>
      page.evaluate((s) => {
        const of = (selector: string) => document.querySelector(selector);
        const button = of(s.radius);
        const strip = of(s.strip);
        const rail = of(s.rail);
        return {
          radius: button ? getComputedStyle(button).borderRadius : '',
          height: button ? getComputedStyle(button).height : '',
          strip: strip ? getComputedStyle(strip).height : '',
          rail: rail ? getComputedStyle(rail).width : '',
        };
      }, selectors);

    const before = await read();
    expect(before.radius).not.toBe('0px');
    expect(before.rail).not.toBe('64px');

    await page.addStyleTag({
      content: `
        .lw-icon-btn { border-radius: 0; height: 2.5rem; }
        .lw-segmented { height: 3rem; }
        lw-shell-rail nav { width: 64px; }
      `,
    });

    await expect.poll(async () => (await read()).radius).toBe('0px');
    const after = await read();
    expect(after.height).toBe('40px');
    expect(after.strip).toBe('48px');
    expect(after.rail).toBe('64px');
  });
});
