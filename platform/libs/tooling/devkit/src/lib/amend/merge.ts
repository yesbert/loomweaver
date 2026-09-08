import {
  AssetGlob,
  BuildTargetAmendment,
  BundleBudget,
  PackageAmendment,
  PostcssAmendment,
} from './types';

export type JsonObject = Record<string, unknown>;

export interface MergeResult {
  readonly value: JsonObject;
  /** What was added, named for the run's own report. Empty when everything was already there. */
  readonly added: readonly string[];
  /** What could not be added because the consumer's value occupies the place it would go. */
  readonly declined: readonly string[];
}

export function normalizeProjectRoot(value: string): string {
  const rooted = value.replace(/^\.?\/*/, '');
  let end = rooted.length;
  while (end > 0 && rooted[end - 1] === '/') {
    end -= 1;
  }
  return rooted.slice(0, end);
}

export function joinProjectPath(projectRoot: string, path: string): string {
  const root = normalizeProjectRoot(projectRoot);
  return root ? `${root}/${path}` : path;
}

export function resolveAssetInput(
  glob: AssetGlob,
  projectRoot: string,
): string {
  return glob.from === 'project'
    ? joinProjectPath(projectRoot, glob.input)
    : glob.input;
}

export function ensurePostcssPlugin(
  existing: unknown,
  amendment: PostcssAmendment,
): MergeResult {
  const root = asObject(existing) ?? {};
  const plugins = asObject(root['plugins']);
  if (plugins === undefined && root['plugins'] !== undefined) {
    return {
      value: root,
      added: [],
      declined: [`${amendment.file}: "plugins" is not an object`],
    };
  }
  const next = { ...plugins };
  if (Object.hasOwn(next, amendment.plugin)) {
    return { value: root, added: [], declined: [] };
  }
  next[amendment.plugin] = {};
  return {
    value: { ...root, plugins: next },
    added: [`${amendment.file}: ${amendment.plugin}`],
    declined: [],
  };
}

/**
 * Records a package the generated files need in the project's manifest. A version already recorded
 * wins wherever it stands — a consumer who pinned it, or moved it to devDependencies, chose that on
 * purpose and this is an "ensure it is present", not a "set it to".
 */
export function ensureDependency(
  manifest: unknown,
  amendment: PackageAmendment,
): MergeResult {
  const root = asObject(manifest) ?? {};
  const dependencies = asObject(root['dependencies']);
  if (dependencies === undefined && root['dependencies'] !== undefined) {
    return {
      value: root,
      added: [],
      declined: ['package.json: "dependencies" is not an object'],
    };
  }
  const recorded =
    dependencies?.[amendment.name] ??
    asObject(root['devDependencies'])?.[amendment.name];
  if (recorded !== undefined) {
    return { value: root, added: [], declined: [] };
  }
  const next = { ...dependencies, [amendment.name]: amendment.version };
  return {
    value: {
      ...root,
      dependencies: Object.fromEntries(
        Object.entries(next).toSorted(([a], [b]) => a.localeCompare(b)),
      ),
    },
    added: [`dependencies: ${amendment.name}@${amendment.version}`],
    declined: [],
  };
}

export function ensureBuildTarget(
  target: unknown,
  amendment: BuildTargetAmendment,
  projectRoot: string,
): MergeResult {
  const next = { ...asObject(target) };
  const added: string[] = [];
  const declined: string[] = [];
  const options = { ...asObject(next['options']) };

  const styles = ensureStrings(
    options['styles'],
    amendment.styles.map((style) => joinProjectPath(projectRoot, style)),
  );
  if (styles.added.length > 0) {
    options['styles'] = styles.value;
    added.push(...styles.added.map((entry) => `styles: ${entry}`));
  }

  const assets = ensureAssets(options['assets'], amendment.assets, projectRoot);
  if (assets.added.length > 0) {
    options['assets'] = assets.value;
    added.push(...assets.added.map((entry) => `assets: ${entry}`));
  }
  next['options'] = options;

  if (
    amendment.inlineCritical !== undefined ||
    amendment.serviceWorker ||
    amendment.initialBudget
  ) {
    const production = ensureProductionConfiguration(
      next['configurations'],
      amendment,
      projectRoot,
    );
    next['configurations'] = production.value;
    added.push(...production.added);
    declined.push(...production.declined);
  }

  return { value: next, added, declined };
}

export function ensureStylesheetSource(css: string, source: string): string {
  const quoted = source.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  if (new RegExp(String.raw`@source\s+['"]${quoted}/?['"]`).test(css)) {
    return css;
  }
  return `${css.trimEnd()}\n\n@source '${source}';\n`;
}

function ensureProductionConfiguration(
  value: unknown,
  amendment: BuildTargetAmendment,
  projectRoot: string,
): MergeResult {
  const configurations = { ...asObject(value) };
  const production = { ...asObject(configurations['production']) };
  const added: string[] = [];
  const declined: string[] = [];

  if (amendment.serviceWorker && production['serviceWorker'] === undefined) {
    production['serviceWorker'] = joinProjectPath(
      projectRoot,
      amendment.serviceWorker,
    );
    added.push(`production serviceWorker: ${production['serviceWorker']}`);
  }

  if (amendment.inlineCritical !== undefined) {
    const critical = ensureInlineCritical(
      production['optimization'],
      amendment.inlineCritical,
    );
    if (critical.declined) {
      declined.push(
        'production optimization is a boolean, so inlineCritical cannot be set beside it — ' +
          'a release build then loads the stylesheet with an inline handler the generated ' +
          'content-security policy blocks, and renders unstyled',
      );
    } else if (critical.changed) {
      production['optimization'] = critical.value;
      added.push(
        `production optimization.styles.inlineCritical: ${amendment.inlineCritical}`,
      );
    }
  }

  if (amendment.initialBudget) {
    const budgets = ensureInitialBudget(
      production['budgets'],
      amendment.initialBudget,
    );
    if (budgets.changed) {
      production['budgets'] = budgets.value;
      added.push(
        `production budget initial: ${amendment.initialBudget.warning} warning, ${amendment.initialBudget.error} error`,
      );
    }
  }

  configurations['production'] = production;
  return { value: configurations, added, declined };
}

function ensureInitialBudget(
  budgets: unknown,
  wanted: BundleBudget,
): { value: unknown[]; changed: boolean } {
  const entries = Array.isArray(budgets) ? [...budgets] : [];
  const index = entries.findIndex(
    (entry) => asObject(entry)?.['type'] === 'initial',
  );
  if (index === -1) {
    return {
      value: [
        ...entries,
        {
          type: 'initial',
          maximumWarning: wanted.warning,
          maximumError: wanted.error,
        },
      ],
      changed: true,
    };
  }
  const current = asObject(entries[index]) ?? {};
  if (!isBelow(current['maximumError'], wanted.error)) {
    return { value: entries, changed: false };
  }
  entries[index] = {
    ...current,
    maximumWarning: wanted.warning,
    maximumError: wanted.error,
  };
  return { value: entries, changed: true };
}

function isBelow(recorded: unknown, wanted: string): boolean {
  const left = toBytes(recorded);
  const right = toBytes(wanted);
  return left !== undefined && right !== undefined && left < right;
}

function toBytes(size: unknown): number | undefined {
  if (typeof size !== 'string') {
    return undefined;
  }
  const match = /^([\d.]+)\s*(b|kb|mb|gb)?$/i.exec(size.trim());
  if (!match) {
    return undefined;
  }
  const units: Record<string, number> = {
    b: 1,
    kb: 1000,
    mb: 1000 * 1000,
    gb: 1000 * 1000 * 1000,
  };
  return Number(match[1]) * units[(match[2] ?? 'b').toLowerCase()];
}

function ensureInlineCritical(
  optimization: unknown,
  inlineCritical: boolean,
): { value: unknown; changed: boolean; declined: boolean } {
  if (typeof optimization === 'boolean') {
    return { value: optimization, changed: false, declined: true };
  }
  const root = { ...asObject(optimization) };
  const styles = asObject(root['styles']);
  if (styles === undefined && root['styles'] !== undefined) {
    return { value: optimization, changed: false, declined: true };
  }
  if (styles?.['inlineCritical'] !== undefined) {
    return { value: optimization, changed: false, declined: false };
  }
  return {
    value: { ...root, styles: { ...styles, inlineCritical } },
    changed: true,
    declined: false,
  };
}

function ensureStrings(
  existing: unknown,
  wanted: readonly string[],
): { value: unknown[]; added: string[] } {
  const list = Array.isArray(existing) ? [...existing] : [];
  const added: string[] = [];
  for (const entry of wanted) {
    if (list.includes(entry)) {
      continue;
    }

    list.push(entry);
    added.push(entry);
  }
  return { value: list, added };
}

function ensureAssets(
  existing: unknown,
  wanted: readonly AssetGlob[],
  projectRoot: string,
): { value: unknown[]; added: string[] } {
  const list = Array.isArray(existing) ? [...existing] : [];
  const added: string[] = [];
  for (const glob of wanted) {
    const input = resolveAssetInput(glob, projectRoot);
    if (list.some((entry) => inputOf(entry) === input)) {
      continue;
    }
    list.push({
      glob: glob.glob,
      input,
      ...(glob.output !== undefined && { output: glob.output }),
    });
    added.push(input);
  }
  return { value: list, added };
}

function inputOf(entry: unknown): string | undefined {
  if (typeof entry === 'string') {
    return entry;
  }
  const asset = asObject(entry);
  return typeof asset?.['input'] === 'string' ? asset['input'] : undefined;
}

function asObject(value: unknown): JsonObject | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;
}
