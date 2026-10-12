import AxeBuilder from '@axe-core/playwright';
import { expect, test, Locator, Page } from '@playwright/test';

async function openInfo(page: Page): Promise<Locator> {
  await page.goto('/');
  await page
    .locator('#panel-views-right-panel')
    .getByRole('tab', { name: 'Info' })
    .click();
  return page.getByRole('group', { name: 'Reply language' });
}

function segment(group: Locator, name: string): Locator {
  return group.locator('label', {
    has: group.page().getByRole('radio', { name }),
  });
}

function look(element: Locator) {
  return element.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      background: style.backgroundColor,
      opacity: style.opacity,
      outline: style.outlineStyle,
    };
  });
}

test.describe('A choice among a few options drawn as one segmented control', () => {
  test('shows every option and marks the chosen one', async ({ page }) => {
    const group = await openInfo(page);

    await expect(group.getByRole('radio')).toHaveCount(3);
    await expect(group.getByRole('radio', { name: 'Auto' })).toBeChecked();
    const chosen = await look(segment(group, 'Auto'));
    const other = await look(segment(group, 'German'));
    expect(chosen.background).not.toEqual(other.background);
  });

  test('is one tab stop, and the arrow keys move the choice with visible focus', async ({
    page,
  }) => {
    const group = await openInfo(page);
    const automatic = group.getByRole('radio', { name: 'Auto' });
    const german = group.getByRole('radio', { name: 'German' });

    await automatic.focus();
    await page.keyboard.press('ArrowRight');

    await expect(german).toBeFocused();
    await expect(german).toBeChecked();
    expect((await look(segment(group, 'German'))).outline).not.toBe('none');

    await page.keyboard.press('Tab');
    expect(
      await group.evaluate((node) => node.contains(document.activeElement)),
    ).toBe(false);
  });

  test('draws an unavailable option as unavailable and keeps it reachable', async ({
    page,
  }) => {
    const group = await openInfo(page);
    const french = group.getByRole('radio', { name: 'French' });

    expect((await look(segment(group, 'French'))).opacity).toBe('0.6');
    await french.focus();
    await expect(french).toBeFocused();
    await expect(french).toHaveAccessibleDescription(
      'French replies need the French voice pack.',
    );
  });

  for (const theme of ['Light', 'Dark']) {
    test(`passes the accessibility audit (${theme.toLowerCase()})`, async ({
      page,
    }) => {
      await openInfo(page);
      await page.addStyleTag({
        content:
          '*, *::before, *::after { transition: none !important; animation: none !important; }',
      });
      await page.getByRole('button', { name: theme }).click();
      const { violations } = await new AxeBuilder({ page })
        .include('[data-testid="testbed-reply-language"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(violations.map((violation) => violation.id)).toEqual([]);
    });
  }
});
