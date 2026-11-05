import {
  asObject,
  joinProjectPath,
  MergeResult,
  normalizeProjectRoot,
} from './merge';
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

function whereTheBuildLooks(
  names: readonly string[],
  projectRoot: string,
): string[] {
  const directories = [...new Set([normalizeProjectRoot(projectRoot), ''])];
  return directories.flatMap((directory) =>
    names.map((name) => joinProjectPath(directory, name)),
  );
}

export function postcssFileTheBuildReads(
  exists: (file: string) => boolean,
  amendment: PostcssAmendment,
  projectRoot = '',
): string {
  return (
    whereTheBuildLooks(READ_BY_THE_BUILD, projectRoot).find((path) => exists(path)) ??
    amendment.file
  );
}

const SCRIPT_POSTCSS_CONFIGS = [
  'postcss.config.js',
  'postcss.config.mjs',
  'postcss.config.cjs',
  '.postcssrc.js',
] as const;

/**
 * Answers with a note where the style pipeline is written as a script, and with nothing where it is
 * not. A note means that nothing was written: the Angular build does not read the script, but a
 * JSON file created beside it would shadow the script for every tool that does. The note names the
 * JSON file the build would read and what that file has to contain, so the choice stays with whoever
 * owns the script.
 */
export function postcssWrittenAsCode(
  exists: (file: string) => boolean,
  amendment: PostcssAmendment,
  projectRoot = '',
): string | undefined {
  const script = whereTheBuildLooks(SCRIPT_POSTCSS_CONFIGS, projectRoot).find(
    (path) => exists(path),
  );
  if (script === undefined) {
    return undefined;
  }
  const file = postcssFileTheBuildReads(exists, amendment, projectRoot);
  const needed = exists(file)
    ? `${file} has to name ${amendment.plugin} under "plugins"`
    : `it needs ${file} containing { "plugins": { "${amendment.plugin}": {} } }, and creating that file shadows ${script} for every tool that reads PostCSS configuration the usual way`;
  return `${script} is a script, which the Angular build does not read: it takes its style pipeline from ${READ_BY_THE_BUILD.join(' or ')} alone. Nothing is written beside it. For ${amendment.plugin} to run in this build, ${needed}. Until then the stylesheet emits no utility class and the workbench renders unstyled.`;
}

