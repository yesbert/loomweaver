/// <reference types='vitest' />
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));

export function nodeLibTestConfig(name: string, root: string) {
  return defineConfig(({ mode }) => ({
    root,
    cacheDir: join(workspaceRoot, 'node_modules/.vite', name),
    resolve: { tsconfigPaths: true },
    test: {
      name,
      watch: false,
      globals: true,
      environment: 'node',
      include: ['src/**/*.{test,spec}.ts'],
      reporters: ['default'],
      coverage: {
        enabled: mode === 'coverage',
        provider: 'v8',
        reportsDirectory: join(workspaceRoot, 'coverage', name),
        reporter: ['lcovonly', 'cobertura'],
      },
    },
  }));
}
