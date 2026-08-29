import { DistributionStyles } from '../../recipes/angular-distribution/recipe';
import { bool, str as string_, ScaffoldValues } from './scaffolds';

export function weaverInput(values: ScaffoldValues) {
  return {
    id: string_(values, 'id') ?? '',
    name: string_(values, 'name'),
    prefix: string_(values, 'prefix'),
    importPath: string_(values, 'importPath'),
    features: {
      command: bool(values, 'command'),
      shortcut: string_(values, 'shortcut'),
      menu: string_(values, 'menu'),
      barItem: bool(values, 'barItem'),
      settings: bool(values, 'settings'),
      about: bool(values, 'about'),
      instanceable: bool(values, 'instanceable'),
      container: bool(values, 'container'),
      agent: bool(values, 'agent'),
      access: string_(values, 'access'),
      spec: bool(values, 'spec'),
    },
  };
}

export function distributionInput(values: ScaffoldValues) {
  return {
    name: string_(values, 'name') ?? '',
    title: string_(values, 'title'),
    directory: string_(values, 'directory'),
    styles:
      (string_(values, 'styles') as DistributionStyles | undefined) ??
      'tailwind',
  };
}
