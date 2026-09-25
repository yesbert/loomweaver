import { Amendment } from '../amend/types';
import { FileMap } from '../generate/types';

export const NEUTRAL_PREFIX = 'app';

export type ScaffoldValues = Readonly<
  Record<string, string | boolean | undefined>
>;

export interface ScaffoldOption {
  readonly name: string;
  readonly type: 'string' | 'boolean';
  readonly description: string;
  readonly required?: boolean;
  readonly default?: string | boolean;
  readonly choices?: readonly string[];
  readonly pattern?: string;
  /**
   * True for options that describe a place in an Nx workspace. An adapter that only returns or
   * writes a file map has nowhere to put them, so it leaves them out of its surface.
   */
  readonly workspaceOnly?: boolean;
}

export interface ScaffoldDescriptor {
  readonly name: string;
  readonly summary: string;
  readonly options: readonly ScaffoldOption[];
  build(values: ScaffoldValues): FileMap;
  /** What the workspace around the generated files must carry. Absent where nothing is needed. */
  amend?(values: ScaffoldValues): readonly Amendment[];
}

export function stringValue(
  values: ScaffoldValues,
  name: string,
): string | undefined {
  const value = values[name];
  return typeof value === 'string' ? value : undefined;
}

export function booleanValue(
  values: ScaffoldValues,
  name: string,
): boolean | undefined {
  const value = values[name];
  return typeof value === 'boolean' ? value : undefined;
}

export const PLACEMENT_OPTIONS: readonly ScaffoldOption[] = [
  {
    name: 'directory',
    type: 'string',
    description: 'Project root, relative to the workspace root.',
    workspaceOnly: true,
  },
  {
    name: 'tags',
    type: 'string',
    description: 'Comma-separated Nx tags for the project.',
    workspaceOnly: true,
  },
  {
    name: 'unitTestRunner',
    type: 'string',
    description:
      "Test wiring to emit. 'vitest' uses @nx/angular:unit-test; 'none' emits no test target.",
    choices: ['vitest', 'none'],
    default: 'vitest',
    workspaceOnly: true,
  },
];

export const APP_OPTION: ScaffoldOption = {
  name: 'app',
  type: 'string',
  description:
    'Application to drop into. Inferred when the workspace has exactly one.',
  workspaceOnly: true,
};
