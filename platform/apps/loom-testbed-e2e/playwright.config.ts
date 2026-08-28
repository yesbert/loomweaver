import { defineConfig, devices } from '@playwright/test';
import { workspaceRoot } from '@nx/devkit';

// Run the E2E suite against the LoomWeaver Testbed distribution's dev server. Playwright starts
// the server itself (and reuses a running one locally) so `nx e2e loom-testbed-e2e` is
// one command. The dev config keeps the service worker off, which suits deterministic tests.
const baseURL = process.env['BASE_URL'] ?? 'http://localhost:4200';

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  // In CI also emit JUnit (for PublishTestResults) + a static HTML report (published as an artifact).
  reporter: process.env['CI']
    ? [
        ['dot'],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['html', { open: 'never' }],
      ]
    : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx nx run loom-testbed:serve',
    url: baseURL,
    cwd: workspaceRoot,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 900 },
      },
    },
  ],
});
