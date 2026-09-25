import {
  DistributionInput,
  DistributionStyles,
} from '../../recipes/angular-distribution/recipe';
import { WeaverInput } from '../../recipes/angular-weaver/recipe';
import { booleanValue, ScaffoldValues, stringValue } from './scaffold-values';

export function weaverInput(values: ScaffoldValues): WeaverInput {
  return {
    id: stringValue(values, 'id') ?? '',
    name: stringValue(values, 'name'),
    prefix: stringValue(values, 'prefix'),
    importPath: stringValue(values, 'importPath'),
    features: {
      command: booleanValue(values, 'command'),
      shortcut: stringValue(values, 'shortcut'),
      menu: stringValue(values, 'menu'),
      barItem: booleanValue(values, 'barItem'),
      settings: booleanValue(values, 'settings'),
      about: booleanValue(values, 'about'),
      instanceable: booleanValue(values, 'instanceable'),
      container: booleanValue(values, 'container'),
      agent: booleanValue(values, 'agent'),
      access: stringValue(values, 'access'),
      spec: booleanValue(values, 'spec'),
    },
  };
}

export function distributionInput(values: ScaffoldValues): DistributionInput {
  return {
    name: stringValue(values, 'name') ?? '',
    title: stringValue(values, 'title'),
    directory: stringValue(values, 'directory'),
    styles:
      (stringValue(values, 'styles') as DistributionStyles | undefined) ??
      'tailwind',
  };
}
