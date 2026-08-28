import { Amendment } from '../../lib/amend/types';
import { ResolvedDistribution } from './recipe';

export function distributionAmendments(
  d: ResolvedDistribution,
): readonly Amendment[] {
  return [
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
    },
  ];
}
