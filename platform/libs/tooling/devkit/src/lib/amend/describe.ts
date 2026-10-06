import { providerLines, registrationLines } from './compose';
import {
  Amendment,
  BuildTargetAmendment,
  ComposePluginAmendment,
  ComposeProviderAmendment,
} from './types';

/**
 * States an amendment as a step a reader can carry out, with what it costs to skip. A route that
 * cannot reach the workspace returns these instead of performing them, so that generated output is
 * never silently incomplete.
 */
export function describeAmendment(amendment: Amendment): string {
  switch (amendment.kind) {
    case 'postcss': {
      return `Write ${amendment.file} beside your package.json, naming ${amendment.plugin}. Without it the stylesheet is read as plain CSS: no utility class is emitted, the workbench renders unstyled, and the build still reports success.`;
    }
    case 'package': {
      return `Add ${amendment.name}@${amendment.version} to your project's dependencies and install it. Without it the generated files import a package that is not there, so the very first build fails.`;
    }
    case 'stylesheet-source': {
      return `Add an @source entry for '${amendment.sourceRoot}' to the application's entry stylesheet, resolved from that stylesheet. Without it none of that code's utilities are emitted.`;
    }
    case 'compose-plugin': {
      return describeRegistration(amendment);
    }
    case 'compose-provider': {
      return describeProviders(amendment);
    }
    case 'stylesheet-import': {
      return `Import '${amendment.file}' in the application's entry stylesheet, resolved from that stylesheet, after its import of ${amendment.after}. ${amendment.without}`;
    }
    case 'build-target': {
      return describeBuildTarget(amendment);
    }
    default: {
      const unknown: never = amendment;
      return unknown;
    }
  }
}

function describeRegistration(amendment: ComposePluginAmendment): string {
  const calls = registrationLines(amendment, amendment.providers ?? []).map(
    (line) => line.replace(/,$/, ''),
  );
  const imports = (amendment.providers ?? [])
    .flatMap((provider) => provider.from ?? [])
    .map(
      (imported) =>
        ` import { ${imported.symbols.join(', ')} } from '${imported.path}'.`,
    )
    .join('');
  return `Register ${amendment.id} in the composition root: import { ${amendment.symbol} }, ${calls.slice(0, -1).join(', ')} and ${calls.at(-1)}.${imports} Without it none of its contributions appear.`;
}

function describeProviders(amendment: ComposeProviderAmendment): string {
  const lines = providerLines(amendment, amendment.module)
    .map((line) => line.replace(/[,;]$/, ''))
    .join('; ');
  const resolved =
    amendment.module === undefined
      ? ''
      : ' Resolve the generated import from the composition root.';
  const keeps = amendment.providers
    .map((provider) => provider.unless)
    .filter((unless): unless is string => unless?.endsWith('(') === true)
    .map((unless) => unless.slice(0, -1));
  const keep =
    keeps.length > 0
      ? ` Where the composition already calls ${keeps.join(' or ')}, that one is the product's choice: keep it, or replace it with this one.`
      : '';
  return `Add to the composition root, after provideShell(): ${lines}.${resolved}${keep} ${amendment.without}`;
}

const STRINGS_COST =
  'the shell fetches its own strings at runtime, so without that glob every label in the chrome renders as its raw translation key';

function assetCost(amendment: BuildTargetAmendment): string {
  const own = amendment.assets
    .map((asset) => asset.without)
    .filter((without): without is string => without !== undefined);
  return own.length > 0 ? own.join('; ') : STRINGS_COST;
}

function describeBuildTarget(amendment: BuildTargetAmendment): string {
  const steps: string[] = [];
  if (amendment.styles.length > 0) {
    steps.push(`name ${amendment.styles.join(', ')} in styles`);
  }
  if (amendment.assets.length > 0) {
    const assets = amendment.assets
      .map((asset) =>
        asset.output ? `${asset.input} served under ${asset.output}` : asset.input,
      )
      .join(', ');
    steps.push(`add assets for ${assets} (${assetCost(amendment)})`);
  }
  if (amendment.serviceWorker) {
    steps.push(
      `set serviceWorker to ${amendment.serviceWorker} in the production configuration (provideShell registers a worker that 404s otherwise)`,
    );
  }
  if (amendment.inlineCritical !== undefined) {
    steps.push(
      `set optimization.styles.inlineCritical to ${amendment.inlineCritical} in the production configuration (the generated content-security policy blocks the inline handler Angular's critical-CSS pass attaches, so a release build renders unstyled)`,
    );
  }
  if (amendment.initialBudget) {
    steps.push(
      `raise the initial bundle budget to ${amendment.initialBudget.warning} warning and ${amendment.initialBudget.error} error in the production configuration (a fresh workspace carries one sized for an empty application, and the workbench alone spends almost all of it, so a release build fails)`,
    );
  }
  return steps.map((step, index) => `${index + 1}. ${step}`).join(' ');
}
