import { addDependenciesToPackageJson, GeneratorCallback, Tree } from '@nx/devkit';
import { Amendment } from '../lib/amend/types';
import {
  amendBuildTarget,
  addPostcssPlugin,
  addStylesheetImport,
  addTailwindSource,
  composeIntoAppConfig,
  composeProvidersIntoAppConfig,
  ResolvedApp,
} from './workspace-tree';

export interface AmendedApp {
  readonly app: ResolvedApp;
  readonly importPath?: string;
}

export function applyAmendments(
  tree: Tree,
  amendments: readonly Amendment[],
  into?: AmendedApp,
): GeneratorCallback | undefined {
  for (const amendment of amendments) {
    apply(tree, amendment, into);
  }
  return installPackages(tree, amendments);
}

function apply(
  tree: Tree,
  amendment: Amendment,
  into: AmendedApp | undefined,
): void {
  switch (amendment.kind) {
    case 'postcss': {
      addPostcssPlugin(tree, amendment);
      return;
    }
    case 'package': {
      return;
    }
    case 'build-target': {
      if (into) {
        amendBuildTarget(tree, into.app.name, amendment);
      }
      return;
    }
    case 'stylesheet-source': {
      if (into) {
        addTailwindSource(tree, into.app.name, amendment.sourceRoot);
      }
      return;
    }
    case 'compose-plugin': {
      if (into?.importPath !== undefined) {
        composeIntoAppConfig(tree, into.app.root, amendment, into.importPath);
      }
      return;
    }
    case 'compose-provider': {
      if (into) {
        composeProvidersIntoAppConfig(tree, into.app.root, amendment);
      }
      return;
    }
    case 'stylesheet-import': {
      if (into) {
        addStylesheetImport(tree, into.app.name, amendment);
      }
    }
  }
}

function installPackages(
  tree: Tree,
  amendments: readonly Amendment[],
): GeneratorCallback | undefined {
  const wanted: Record<string, string> = {};
  for (const amendment of amendments) {
    if (amendment.kind === 'package') {
      wanted[amendment.name] = amendment.version;
    }
  }
  return Object.keys(wanted).length === 0
    ? undefined
    : addDependenciesToPackageJson(tree, wanted, {});
}
