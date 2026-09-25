import { FileMap, Recipe } from '../../lib/generate/types';
import {
  RAIL_REGION,
  renderRegions,
  STATUS_BAR_REGION,
} from '../shell-regions';
import { isKebabId, toCamelCase } from '../../lib/generate/casing';

export interface LayoutInput {
  readonly name?: string;
}

export interface ResolvedLayout {
  readonly name: string;
  readonly propertyName: string;
}

export function resolveLayoutInput(input: LayoutInput): ResolvedLayout {
  const name = input.name?.trim() || 'base';
  if (!isKebabId(name)) {
    throw new Error(`Layout name must be kebab-case (e.g. "base"); got "${name}".`);
  }
  return { name, propertyName: toCamelCase(name) };
}

function moduleFile(layout: ResolvedLayout): string {
  return `// A base layout for the distribution. Pass it to provideLayout(${layout.propertyName}Layout)
// in src/app/app.config.ts. Region ids are what contributions target — '${RAIL_REGION}' (rail) and '${STATUS_BAR_REGION}' (bar) match
// the devkit weaver defaults, so a scaffolded weaver's rail + bar items land here.
import { ShellLayout } from '@loomweaver/shell';

export const ${layout.propertyName}Layout: ShellLayout = {
  regions: [
${renderRegions(' '.repeat(4))}
  ],
};
`;
}

export const layout: Recipe<LayoutInput> = {
  id: 'layout',
  build(input: LayoutInput): FileMap {
    const layout = resolveLayoutInput(input);
    return { [`${layout.name}-layout.ts`]: moduleFile(layout) };
  },
};
