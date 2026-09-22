import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

async function placeBubble(page: Page): Promise<void> {
  await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'grid-tooltip-host';
    host.style.cssText = 'position:absolute;top:120px;left:120px;';
    const bubble = document.createElement('div');
    bubble.id = 'product-bubble';
    bubble.className = 'lw-tooltip-bubble';
    for (const [text, tone] of [
      ['Neutral', ''],
      ['Brand', 'lw-badge--brand'],
    ]) {
      const badge = document.createElement('span');
      badge.className = `lw-badge ${tone}`.trim();
      badge.textContent = text;
      bubble.append(badge);
    }
    host.append(bubble);
    document.body.append(host);
  });
}

async function contrastViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .include('#product-bubble')
    .withRules(['color-contrast'])
    .analyze();
  return violations.map((violation) => ({
    id: violation.id,
    nodes: violation.nodes.map((node) => node.failureSummary),
  }));
}

test.describe('The tooltip look works wherever it is placed', () => {
  test('a product element takes the look and stays where its container put it', async ({
    page,
  }) => {
    await page.goto('/');
    await placeBubble(page);

    const look = await page.evaluate(() => {
      const tip = document.createElement('lw-tooltip');
      tip.setAttribute('text', 'Reference');
      document.body.append(tip);
      const reference = getComputedStyle(
        tip.querySelector('.lw-tooltip-bubble') as HTMLElement,
      );
      const product = getComputedStyle(
        document.querySelector('#product-bubble') as HTMLElement,
      );
      const keys = [
        'backgroundColor',
        'color',
        'borderRadius',
        'paddingLeft',
        'fontSize',
        'boxShadow',
      ] as const;
      const result = {
        position: product.position,
        pointerEvents: product.pointerEvents,
        product: keys.map((key) => product[key]),
        reference: keys.map((key) => reference[key]),
      };
      tip.remove();
      return result;
    });

    expect(look.position).toBe('static');
    expect(look.pointerEvents).not.toBe('none');
    expect(look.product).toEqual(look.reference);
  });

  test("a neutral badge inside it takes the bubble's text colour", async ({
    page,
  }) => {
    await page.goto('/');
    await placeBubble(page);

    const colours = await page.evaluate(() => {
      const bubble = document.querySelector('#product-bubble') as HTMLElement;
      const [neutral, brand] = [...bubble.querySelectorAll('.lw-badge')];
      return {
        bubble: getComputedStyle(bubble).color,
        neutral: getComputedStyle(neutral).color,
        neutralBackground: getComputedStyle(neutral).backgroundColor,
        brandBackground: getComputedStyle(brand).backgroundColor,
        brandOutside: (() => {
          const probe = document.createElement('span');
          probe.className = 'lw-badge lw-badge--brand';
          document.body.append(probe);
          const value = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return value;
        })(),
      };
    });

    expect(colours.neutral).toBe(colours.bubble);
    expect(colours.neutralBackground).not.toBe('rgba(0, 0, 0, 0)');
    expect(colours.brandBackground).toBe(colours.brandOutside);
  });

  test('badges inside it stay readable in the light appearance', async ({
    page,
  }) => {
    await page.goto('/');
    await placeBubble(page);

    expect(await contrastViolations(page)).toEqual([]);
  });

  test('badges inside it stay readable in the dark appearance', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await placeBubble(page);

    expect(await contrastViolations(page)).toEqual([]);
  });
});
