import { DistributionStyles } from '../../recipes/angular-distribution/recipe';
import { bool, str, ScaffoldValues } from './scaffolds';

export function weaverInput(values: ScaffoldValues) {
  return {
    id: str(values, 'id') ?? '',
    name: str(values, 'name'),
    prefix: str(values, 'prefix'),
    importPath: str(values, 'importPath'),
    features: {
      command: bool(values, 'command'),
      shortcut: str(values, 'shortcut'),
      menu: str(values, 'menu'),
      barItem: bool(values, 'barItem'),
      settings: bool(values, 'settings'),
      about: bool(values, 'about'),
      instanceable: bool(values, 'instanceable'),
      container: bool(values, 'container'),
      access: str(values, 'access'),
      spec: bool(values, 'spec'),
    },
  };
}

export function distributionInput(values: ScaffoldValues) {
  return {
    name: str(values, 'name') ?? '',
    title: str(values, 'title'),
    directory: str(values, 'directory'),
    styles:
      (str(values, 'styles') as DistributionStyles | undefined) ?? 'tailwind',
  };
}
