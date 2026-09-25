import type { Page } from '@playwright/test';

export function navEntry(page: Page, path: string) {
  return page.locator(`[data-nav-view="${path}"]`);
}

export function navArea(page: Page, area: string) {
  return page.locator(`[data-nav-area="${area}"]`);
}

export function areaHeading(page: Page, area: string) {
  return navArea(page, area).locator('.lw-nav-group-heading');
}
