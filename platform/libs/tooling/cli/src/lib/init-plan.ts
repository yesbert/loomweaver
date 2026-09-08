import { existsSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { ArgError, boolFlag, ParsedArgs, stringFlag } from './args';
import { nxApplications } from './nx-applications';
import {
  detectPackageManager,
  PackageManager,
  packageManagerFrom,
} from './package-manager';
import {
  findWorkspace,
  readJsonFile,
  Workspace,
  WorkspaceError,
} from './workspace';

export interface InitDeps {
  readonly cwd: string;
  exec(argv: readonly string[], cwd: string): void;
  run(argv: readonly string[]): number;
  readonly version: string;
}

export const RUNTIME_PACKAGES = [
  '@loomweaver/shell',
  '@loomweaver/plugin-sdk',
  '@loomweaver/frame-kit',
  '@angular/cdk',
  '@jsverse/transloco',
  '@ng-icons/heroicons',
] as const;

export const STYLE_PACKAGES = [
  'tailwindcss',
  '@tailwindcss/postcss',
  '@tailwindcss/typography',
] as const;

export const SERVICE_WORKER = '@angular/service-worker';

export const NX_COLLECTION = '@loomweaver/devkit';

export interface Manifest {
  readonly name?: string;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

export interface Application {
  readonly name: string;
  readonly root: string;
}

export interface Plan {
  readonly workspace: Workspace & { readonly kind: 'angular' | 'nx' };
  readonly manager: PackageManager;
  readonly lockfile?: string;
  readonly name: string;
  readonly title: string;
  readonly styles: string;
  readonly weaver?: string;
  readonly runtime: readonly string[];
  readonly dev: readonly string[];
  readonly app?: Application;
  readonly dryRun: boolean;
}

export function planInit(args: ParsedArgs, deps: InitDeps): Plan {
  const found = findWorkspace(deps.cwd);
  if (!found?.kind) {
    throw new WorkspaceError(
      `No Angular application or Nx workspace here: expected an angular.json or an nx.json at or above ${resolve(deps.cwd)}. ` +
        'Create one first ("ng new my-studio --style=css --ssr=false", or "npx create-nx-workspace") and run init inside it.',
    );
  }
  const workspace = found as Plan['workspace'];
  const manifest = readManifest(workspace.root);
  const override = packageManagerFrom(stringFlag(args, 'package-manager'));
  const detected = detectPackageManager(workspace.root);
  const app =
    workspace.kind === 'nx'
      ? chooseApplication(workspace.root, stringFlag(args, 'app'))
      : undefined;
  const name = app?.name ?? kebab(manifest.name ?? basename(workspace.root));
  const styles = stringFlag(args, 'styles') ?? 'tailwind';
  const declared = { ...manifest.dependencies, ...manifest.devDependencies };
  const missing = (names: readonly string[]) =>
    names.filter((candidate) => !Object.hasOwn(declared, candidate));
  return {
    workspace,
    manager: override ?? detected.manager,
    lockfile: override ? undefined : detected.lockfile,
    name,
    title: stringFlag(args, 'title') ?? titleCase(name),
    styles,
    weaver: weaverId(args),
    runtime: [
      ...missing(RUNTIME_PACKAGES),
      ...(Object.hasOwn(declared, SERVICE_WORKER)
        ? []
        : [serviceWorkerSpec(workspace.root, manifest)]),
    ],
    dev: [
      ...(styles === 'tailwind' ? missing(STYLE_PACKAGES) : []),
      ...(workspace.kind === 'nx' && !Object.hasOwn(declared, NX_COLLECTION)
        ? [collectionSpec(deps.version)]
        : []),
    ],
    app,
    dryRun: boolFlag(args, 'dry-run') === true,
  };
}

export function chooseApplication(
  root: string,
  wanted: string | undefined,
): Application {
  const apps = nxApplications(root);
  const names = apps.map((candidate) => candidate.name).join(', ');
  if (wanted) {
    const app = apps.find((candidate) => candidate.name === wanted);
    if (!app) {
      throw new WorkspaceError(
        `No application named "${wanted}" in this workspace${apps.length > 0 ? `; there are: ${names}` : ''}.`,
      );
    }
    return app;
  }
  if (apps.length === 1) {
    return apps[0];
  }
  if (apps.length === 0) {
    throw new WorkspaceError(
      'This Nx workspace has no application (no project.json with "projectType": "application"). Generate one first, then run init with --app <name>.',
    );
  }
  throw new WorkspaceError(
    `This Nx workspace has ${apps.length} applications, so none was chosen: ${names}. Name one with --app.`,
  );
}

export function weaverId(args: ParsedArgs): string | undefined {
  const value = args.flags['weaver'];
  if (value === false) {
    return undefined;
  }
  if (value === true) {
    throw new ArgError(
      'Option --weaver needs a plugin id, or pass --no-weaver.',
    );
  }
  return value ?? 'notes';
}

export function readManifest(root: string): Manifest {
  const file = join(root, 'package.json');
  return existsSync(file) ? (readJsonFile(file) as Manifest) : {};
}

export function serviceWorkerSpec(root: string, manifest: Manifest): string {
  const installed = join(root, 'node_modules/@angular/core/package.json');
  if (existsSync(installed)) {
    const { version } = JSON.parse(readFileSync(installed, 'utf8')) as {
      version: string;
    };
    return `${SERVICE_WORKER}@${version}`;
  }
  const declared = manifest.dependencies?.['@angular/core'];
  return declared ? `${SERVICE_WORKER}@${declared}` : SERVICE_WORKER;
}

export function collectionSpec(version: string): string {
  return version === '0.0.0'
    ? `${NX_COLLECTION}@latest`
    : `${NX_COLLECTION}@${version}`;
}

export function kebab(value: string): string {
  const unscoped = value.includes('/')
    ? value.slice(value.lastIndexOf('/') + 1)
    : value;
  return unscoped
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join('-');
}

export function titleCase(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
