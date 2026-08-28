import { Amendment } from './types';

/**
 * States an amendment as a step a reader can carry out, with what it costs to skip. A route that
 * cannot reach the workspace returns these instead of performing them, so that generated output is
 * never silently incomplete.
 */
export function describeAmendment(amendment: Amendment): string {
  if (amendment.kind === 'postcss') {
    return `Write ${amendment.file} beside your package.json, naming ${amendment.plugin}. Without it the stylesheet is read as plain CSS: no utility class is emitted, the workbench renders unstyled, and the build still reports success.`;
  }
  if (amendment.kind === 'stylesheet-source') {
    return `Add an @source entry for '${amendment.sourceRoot}' to the application's entry stylesheet, resolved from that stylesheet. Without it none of that code's utilities are emitted.`;
  }
  if (amendment.kind === 'compose-plugin') {
    return `Register ${amendment.id} in the composition root: import { ${amendment.symbol} }, provideTranslationNamespaces('${amendment.id}'), provideCapabilityGrants({ ${amendment.id}: [${amendment.capabilities
      .map((capability) => `'${capability}'`)
      .join(
        ', ',
      )}] }) and ...providePlugins(${amendment.symbol}). Without it none of its contributions appear.`;
  }
  return [
    ...(amendment.styles.length > 0
      ? [`name ${amendment.styles.join(', ')} in styles`]
      : []),
    ...(amendment.assets.length > 0
      ? [
          `add assets for ${amendment.assets
            .map((asset) => asset.input)
            .join(', ')} (the shell fetches its own strings at runtime, so without that glob every label in the chrome renders as its raw translation key)`,
        ]
      : []),
    ...(amendment.serviceWorker
      ? [
          `set serviceWorker to ${amendment.serviceWorker} in the production configuration (provideShell registers a worker that 404s otherwise)`,
        ]
      : []),
    ...(amendment.inlineCritical === undefined
      ? []
      : [
          `set optimization.styles.inlineCritical to ${amendment.inlineCritical} in the production configuration (the generated content-security policy blocks the inline handler Angular's critical-CSS pass attaches, so a release build renders unstyled)`,
        ]),
  ]
    .map((step, index) => `${index + 1}. ${step}`)
    .join(' ');
}
