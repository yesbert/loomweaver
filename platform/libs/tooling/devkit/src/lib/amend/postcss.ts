import { asObject, MergeResult } from './merge';
import { PostcssAmendment } from './types';

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

const CODE_POSTCSS_CONFIGS = [
  'postcss.config.js',
  'postcss.config.mjs',
  'postcss.config.cjs',
  '.postcssrc.js',
] as const;

export function postcssWrittenAsCode(
  exists: (file: string) => boolean,
  amendment: PostcssAmendment,
): string | undefined {
  const inTheWay = CODE_POSTCSS_CONFIGS.find((name) => exists(name));
  return inTheWay === undefined
    ? undefined
    : `${inTheWay} is written as code and cannot be merged into, so add ${amendment.plugin} to it yourself; until then the stylesheet emits no utility class and the workbench renders unstyled.`;
}

