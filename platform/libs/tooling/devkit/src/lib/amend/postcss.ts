import { asObject, MergeResult } from './merge';
import { PostcssAmendment } from './types';

export function ensurePostcssPlugin(
  existing: unknown,
  amendment: PostcssAmendment,
  file: string = amendment.file,
): MergeResult {
  const root = asObject(existing) ?? {};
  const plugins = asObject(root['plugins']);
  if (plugins === undefined && root['plugins'] !== undefined) {
    return {
      value: root,
      added: [],
      declined: [`${file}: "plugins" is not an object`],
    };
  }
  const next = { ...plugins };
  if (Object.hasOwn(next, amendment.plugin)) {
    return { value: root, added: [], declined: [] };
  }
  next[amendment.plugin] = {};
  return {
    value: { ...root, plugins: next },
    added: [`${file}: ${amendment.plugin}`],
    declined: [],
  };
}

const READ_BY_THE_BUILD = ['postcss.config.json', '.postcssrc.json'] as const;

export function postcssFileTheBuildReads(
  exists: (file: string) => boolean,
  amendment: PostcssAmendment,
): string {
  return READ_BY_THE_BUILD.find((name) => exists(name)) ?? amendment.file;
}

const SCRIPT_POSTCSS_CONFIGS = [
  'postcss.config.js',
  'postcss.config.mjs',
  'postcss.config.cjs',
  '.postcssrc.js',
] as const;

export function postcssWrittenAsCode(
  exists: (file: string) => boolean,
  amendment: PostcssAmendment,
): string | undefined {
  const ignored = SCRIPT_POSTCSS_CONFIGS.find((name) => exists(name));
  return ignored === undefined
    ? undefined
    : `${ignored} is a script, which the Angular build does not read: it takes its style pipeline from ${READ_BY_THE_BUILD.join(' or ')} alone. That is why ${amendment.plugin} is added to ${postcssFileTheBuildReads(exists, amendment)}, and why nothing ${ignored} sets up reaches this build until it is stated there too.`;
}

