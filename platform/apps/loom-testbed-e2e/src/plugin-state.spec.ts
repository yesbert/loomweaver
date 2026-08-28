import { expect, test } from '@playwright/test';

test.describe('A plugin-private store', () => {
  test('two surfaces of one plugin share it live, and it survives a reload', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('scratch-input').fill('carried across surfaces');

    await expect(page.getByTestId('scratch-echo')).toHaveText(
      'carried across surfaces',
    );

    await expect
      .poll(() =>
        page.evaluate(() =>
          localStorage.getItem('lw.plugin-state:testbed:scratch'),
        ),
      )
      .toContain('carried across surfaces');
    await page.reload();

    await expect(page.getByTestId('scratch-input')).toHaveValue(
      'carried across surfaces',
    );
    await expect(page.getByTestId('scratch-echo')).toHaveText(
      'carried across surfaces',
    );
  });

  test('it reaches a second window, and stays inside the plugin namespace', async ({
    page,
    context,
  }) => {
    await page.goto('/');
    await page.getByTestId('scratch-input').fill('typed in window one');
    await expect(page.getByTestId('scratch-echo')).toHaveText(
      'typed in window one',
    );

    const second = await context.newPage();
    await second.goto('/');

    await expect(second.getByTestId('scratch-echo')).toHaveText(
      'typed in window one',
    );
    const keys = await second.evaluate(() =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith('lw.plugin-state'),
      ),
    );
    expect(keys).toEqual(
      expect.arrayContaining([
        'lw.plugin-state:testbed:scratch',
        'lw.plugin-state-keys:testbed',
      ]),
    );
    await second.close();
  });
});
