import { FrameLocator, Locator, Page, expect, test } from '@playwright/test';

const FRAME = 'iframe[src="/docked-frame/view.html"]';

function frameElement(page: Page): Locator {
  return page.locator(FRAME);
}

function dockedFrame(page: Page): FrameLocator {
  return page.frameLocator(FRAME);
}

function sidebarTab(page: Page, name: string): Locator {
  return page.locator(
    `#panel-views-right-panel [role="tab"][aria-label="${name}"]`,
  );
}

async function openDockedFrame(page: Page): Promise<void> {
  await page.goto('/');
  await sidebarTab(page, 'Docked frame').click();
}

test.describe('An iframe surface docked in a sidebar', () => {
  test('renders, and is told it has an instance but no tab', async ({
    page,
  }) => {
    await openDockedFrame(page);

    const frame = dockedFrame(page);
    await expect(frame.getByTestId('frame-title')).toHaveText('Docked frame');
    await expect(frame.getByTestId('frame-instance')).toHaveText(
      'testbed.dockedFrame',
    );
    await expect(frame.getByTestId('frame-tab')).toHaveText('(none)');
  });

  test('its navigate resolves as a no-op instead of throwing, and the app does not move', async ({
    page,
  }) => {
    await openDockedFrame(page);
    await expect(
      dockedFrame(page).getByTestId('frame-instance'),
    ).not.toHaveText('—');
    const before = page.url();

    await dockedFrame(page).getByTestId('frame-navigate').click();

    await expect(dockedFrame(page).getByTestId('frame-nav-result')).toHaveText(
      'resolved',
    );
    expect(page.url()).toBe(before);
  });

  test('declaring retain keeps it alive and loaded across a sidebar tab switch', async ({
    page,
  }) => {
    await openDockedFrame(page);
    await dockedFrame(page).getByTestId('frame-draft').fill('scratch');

    await sidebarTab(page, 'Info').click();
    await expect(frameElement(page)).toBeHidden();

    await sidebarTab(page, 'Docked frame').click();

    await expect(dockedFrame(page).getByTestId('frame-draft')).toHaveValue(
      'scratch',
    );
  });

  test('a retained docked surface survives collapsing the sidebar', async ({
    page,
  }) => {
    await openDockedFrame(page);
    await dockedFrame(page).getByTestId('frame-draft').fill('kept');

    const collapse = page.getByRole('button', { name: 'Collapse panel' });
    await expect(collapse).toHaveCount(2);
    await collapse.nth(1).click();
    await expect(frameElement(page)).toBeHidden();

    await page.getByRole('button', { name: 'Expand panel' }).last().click();

    await expect(dockedFrame(page).getByTestId('frame-draft')).toHaveValue(
      'kept',
    );
  });

  test('a docked surface that does not retain leaves the DOM when hidden', async ({
    page,
  }) => {
    const sandboxFrame = 'iframe[src="/docked-frame/view.html?sandbox=1"]';
    await page.goto('/');
    await sidebarTab(page, 'Sandbox (docked)').click();
    await expect(page.locator(sandboxFrame)).toBeVisible();

    await sidebarTab(page, 'Info').click();

    await expect(page.locator(sandboxFrame)).toHaveCount(0);
  });
});

test.describe('A sandboxed plugin docks a sidebar view', () => {
  const SANDBOX_FRAME = 'iframe[src="/docked-frame/view.html?sandbox=1"]';

  test('the surface reaches the sidebar without the user dragging anything', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(
      page.locator(
        '#panel-views-right-panel [role="tab"][aria-label="Sandbox (docked)"]',
      ),
    ).toBeVisible();

    await page
      .locator(
        '#panel-views-right-panel [role="tab"][aria-label="Sandbox (docked)"]',
      )
      .click();

    const frame = page.frameLocator(SANDBOX_FRAME);
    await expect(frame.getByTestId('frame-title')).toHaveText('Docked frame');
    await expect(frame.getByTestId('frame-instance')).toHaveText(
      'sandbox-static.docked',
    );
  });
});

test.describe('A container child may be an iframe', () => {
  const CHILD = 'iframe[src="/docked-frame/view.html?child=1"]';

  test('sits in the same inner tree as a component child and is told the container id', async ({
    page,
  }) => {
    await page.goto('/workspace/alpha');
    const host = page.locator('lw-container-pane-host');
    await expect(host).toBeVisible();
    await expect(page.getByTestId('testbed-ws-sim')).toBeVisible();

    await host.getByTestId('pane-add-tab').first().click();
    await page
      .locator('lw-menu')
      .getByText('Frame child', { exact: true })
      .click();

    await expect(
      page.frameLocator(CHILD).getByTestId('frame-params'),
    ).toHaveText('{"id":"alpha"}');
    await expect(page.frameLocator(CHILD).getByTestId('frame-tab')).toHaveText(
      '(none)',
    );
  });

  test('another container hands its iframe child a different id', async ({
    page,
  }) => {
    await page.goto('/workspace/beta');
    const host = page.locator('lw-container-pane-host');
    await host.getByTestId('pane-add-tab').first().click();
    await page
      .locator('lw-menu')
      .getByText('Frame child', { exact: true })
      .click();

    await expect(
      page.frameLocator(CHILD).getByTestId('frame-params'),
    ).toHaveText('{"id":"beta"}');
  });
});
