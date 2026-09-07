import { Amendment, BundleBudget } from '../../lib/amend/types';
import { PLATFORM_VERSION } from '../platform-version';
import { ResolvedDistribution } from './recipe';

/**
 * The initial-bundle budget a generated distribution carries. Stated once, because two figures that
 * must agree with a measurement cannot live in two files: the workbench alone measures about
 * 900 kB, so the warning leaves a product some 600 kB of its own before it speaks and the error
 * roughly twice that before it stops the build.
 */
export const DISTRIBUTION_INITIAL_BUDGET: BundleBudget = {
  warning: '1.5MB',
  error: '2MB',
};

export function distributionAmendments(
  d: ResolvedDistribution,
): readonly Amendment[] {
  return [
    {
      kind: 'package' as const,
      name: '@loomweaver/frame-kit',
      version: `^${PLATFORM_VERSION}`,
    },
    ...(d.styles === 'tailwind'
      ? [
          {
            kind: 'postcss' as const,
            file: '.postcssrc.json' as const,
            plugin: '@tailwindcss/postcss',
          },
        ]
      : []),
    {
      kind: 'build-target' as const,
      styles: ['src/styles.css'],
      assets: [
        { glob: '**/*', input: 'public', from: 'project' as const },
        {
          glob: '**/*',
          input: 'node_modules/@loomweaver/shell/i18n',
          from: 'workspace' as const,
          output: 'i18n',
        },
        {
          glob: '**/*',
          input: 'node_modules/@loomweaver/frame-kit/dist',
          from: 'workspace' as const,
          output: 'frame-kit',
        },
      ],
      serviceWorker: 'ngsw-config.json',
      inlineCritical: false,
      initialBudget: DISTRIBUTION_INITIAL_BUDGET,
    },
  ];
}
