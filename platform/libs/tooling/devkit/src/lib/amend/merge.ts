import { AssetGlob, BuildTargetAmendment, PostcssAmendment } from './types';

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

export function resolveAssetInput(glob: AssetGlob, projectRoot: string): string {
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
  if (amendment.plugin in next) {
    return { value: root, added: [], declined: [] };
  }
  next[amendment.plugin] = {};
  return {
    value: { ...root, plugins: next },
    added: [`${amendment.file}: ${amendment.plugin}`],
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

  if (amendment.inlineCritical !== undefined || amendment.serviceWorker) {
    const configurations = { ...asObject(next['configurations']) };
    const production = { ...asObject(configurations['production']) };

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

    configurations['production'] = production;
    next['configurations'] = configurations;
  }

  return { value: next, added, declined };
}

export function ensureStylesheetSource(css: string, source: string): string {
  const quoted = source.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  if (new RegExp(String.raw`@source\s+['"]${quoted}/?['"]`).test(css)) {
    return css;
  }
  return `${css.trimEnd()}\n\n@source '${source}';\n`;
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
    if (!list.includes(entry)) {
      list.push(entry);
      added.push(entry);
    }
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
      ...(glob.output === undefined ? {} : { output: glob.output }),
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
