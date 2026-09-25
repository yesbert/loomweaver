import type { Page } from '@playwright/test';

const MAIN_STRIP = '[id="pane-strip:content:main"]';

export function tab(page: Page, path: string) {
  return page.locator(`${MAIN_STRIP} [role="tab"][data-tab-path="${path}"]`);
}

export function tabWithControls(page: Page, path: string) {
  return page.locator(`${MAIN_STRIP} div:has(> [data-tab-path="${path}"])`);
}

export function tabLabels(page: Page) {
  return page
    .locator(`${MAIN_STRIP} [role="tab"]`)
    .evaluateAll((all) => all.map((tab) => tab.getAttribute('aria-label') ?? ''));
}
