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
  if (amendment.kind === 'package') {
    return `Add ${amendment.name}@${amendment.version} to your project's dependencies and install it. Without it the generated files import a package that is not there, so the very first build fails.`;
  }
  if (amendment.kind === 'stylesheet-source') {
    return `Add an @source entry for '${amendment.sourceRoot}' to the application's entry stylesheet, resolved from that stylesheet. Without it none of that code's utilities are emitted.`;
  }
  if (amendment.kind === 'compose-plugin') {
    const providers = (amendment.providers ?? [])
      .map((provider) => `${provider.line.replace(/,$/, '')}, `)
      .join('');
    const capabilities = amendment.capabilities
      .map((capability) => `'${capability}'`)
      .join(', ');
    const imports = (amendment.providers ?? [])
      .flatMap((provider) => provider.from ?? [])
      .map(
        (imported) =>
          ` import { ${imported.symbols.join(', ')} } from '${imported.path}'.`,
      )
      .join('');
    return `Register ${amendment.id} in the composition root: import { ${amendment.symbol} }, ${providers}provideTranslationNamespaces('${amendment.id}'), provideCapabilityGrants({ ${amendment.id}: [${capabilities}] }) and ...providePlugins(${amendment.symbol}).${imports} Without it none of its contributions appear.`;
  }
  return [
    ...(amendment.styles.length > 0
      ? [`name ${amendment.styles.join(', ')} in styles`]
      : []),
    ...(amendment.assets.length > 0
      ? [
          `add assets for ${amendment.assets
            .map((asset) =>
              asset.output
                ? `${asset.input} served under ${asset.output}`
                : asset.input,
            )
            .join(
              ', ',
            )} (the shell fetches its own strings at runtime, so without that glob every label in the chrome renders as its raw translation key)`,
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
    ...(amendment.initialBudget
      ? [
          `raise the initial bundle budget to ${amendment.initialBudget.warning} warning and ${amendment.initialBudget.error} error in the production configuration (a fresh workspace carries one sized for an empty application, and the workbench alone spends almost all of it, so a release build fails)`,
        ]
      : []),
  ]
    .map((step, index) => `${index + 1}. ${step}`)
    .join(' ');
}
