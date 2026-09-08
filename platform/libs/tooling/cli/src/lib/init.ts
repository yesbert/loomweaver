import { existsSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import {
  ArgError,
  boolFlag,
  ParsedArgs,
  rejectUnknownFlags,
  stringFlag,
} from './args';
import { nxApplications } from './nx-applications';
import {
  detectPackageManager,
  execCommand,
  installCommand,
  PackageManager,
  packageManagerFrom,
  runScriptCommand,
} from './package-manager';
import type { Io } from './run';
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

const SERVICE_WORKER = '@angular/service-worker';
const NX_COLLECTION = '@loomweaver/devkit';
const INIT_FLAGS = [
  'title',
  'styles',
  'weaver',
  'app',
  'package-manager',
  'dry-run',
];

interface Manifest {
  readonly name?: string;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

interface Application {
  readonly name: string;
  readonly root: string;
}

interface Plan {
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

interface Step {
  readonly label: string;
  readonly describe: string;
  readonly done: boolean;
  readonly command?: readonly string[];
  readonly argv?: readonly string[];
  readonly after?: string;
}

export function init(args: ParsedArgs, io: Io, deps: InitDeps): number {
  rejectUnknownFlags(args, INIT_FLAGS);
  const plan = planInit(args, deps);
  report(io, plan);
  let didSomething = false;
  for (const step of stepsFor(plan)) {
    if (step.done) {
      io.out(`${step.label}: already there.`);
      continue;
    }
    didSomething = true;
    const code = perform(step, plan, io, deps);
    if (code !== 0) {
      io.err(`${step.label} failed; nothing after it was run.`);
      return code;
    }
  }
  if (!plan.weaver) {
    io.out(
      'First weaver: skipped as asked; the rail stays empty until a plugin is composed in.',
    );
  }
  if (!didSomething) {
    io.out(
      'Nothing left to do: the packages, the distribution and the weaver are all in place.',
    );
  }
  io.out(
    `${plan.dryRun ? 'Then serve' : 'Serve'} it with: ${serveCommand(plan)}`,
  );
  return 0;
}

function perform(step: Step, plan: Plan, io: Io, deps: InitDeps): number {
  if (step.command) {
    if (plan.dryRun) {
      io.out(`Would run: ${step.command.join(' ')}`);
      return 0;
    }
    io.out(`${step.label}: ${step.describe}`);
    deps.exec(step.command, plan.workspace.root);
    return 0;
  }
  if (step.argv) {
    io.out(
      plan.dryRun
        ? `Would ${step.label.toLowerCase()}: ${step.describe}`
        : `${step.label}: ${step.describe}`,
    );
    if (plan.dryRun && step.after) {
      io.out(`  (${step.after})`);
    }
    return deps.run(plan.dryRun ? [...step.argv, '--dry-run'] : step.argv);
  }
  return 0;
}

function planInit(args: ParsedArgs, deps: InitDeps): Plan {
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

function report(io: Io, plan: Plan): void {
  const where =
    plan.workspace.kind === 'nx'
      ? `Nx workspace, application ${plan.app?.name}`
      : 'Angular CLI application';
  io.out(
    `${plan.dryRun ? 'Would take' : 'Taking'} ${plan.workspace.root} to a product: ${where}, packages with ${managerLabel(plan)}.`,
  );
}

function managerLabel(plan: Plan): string {
  if (plan.lockfile) {
    return `${plan.manager} (from ${plan.lockfile})`;
  }
  if (plan.manager === 'npm') {
    return 'npm (no lockfile found, so npm)';
  }
  return plan.manager;
}

function stepsFor(plan: Plan): Step[] {
  return plan.workspace.kind === 'nx' ? nxSteps(plan) : angularSteps(plan);
}

function angularSteps(plan: Plan): Step[] {
  const root = plan.workspace.root;
  const steps: Step[] = [
    ...installSteps(plan),
    {
      label: 'Distribution',
      describe: `scaffold the composition root for "${plan.title}" (${plan.styles}) and wire the build`,
      done: composesShell(join(root, 'src/app/app.config.ts')),
      argv: [
        'distribution',
        '--name',
        plan.name,
        '--title',
        plan.title,
        '--styles',
        plan.styles,
        '--out',
        root,
        '--force',
      ],
    },
  ];
  if (plan.weaver) {
    steps.push({
      label: 'First weaver',
      describe: weaverDescription(plan.weaver),
      done: existsSync(join(root, 'src', plan.weaver, 'src/index.ts')),
      after:
        'planned against the composition root as it is now; once the distribution step has run, the weaver composes into it',
      argv: [
        'weaver',
        '--id',
        plan.weaver,
        '--command',
        '--out',
        join(root, 'src', plan.weaver),
      ],
    });
  }
  return steps;
}

function nxSteps(plan: Plan): Step[] {
  const root = plan.workspace.root;
  const app = plan.app;
  if (!app) {
    return [];
  }
  const generator = (name: string, argv: readonly string[]) =>
    execCommand(plan.manager, ['nx', 'g', `${NX_COLLECTION}:${name}`, ...argv]);
  const steps: Step[] = [
    ...installSteps(plan),
    {
      label: 'Distribution',
      describe: `nx g ${NX_COLLECTION}:distribution over ${app.name} for "${plan.title}" (${plan.styles})`,
      done: composesShell(join(root, app.root, 'src/app/app.config.ts')),
      command: generator('distribution', [
        '--name',
        app.name,
        '--directory',
        app.root,
        '--title',
        plan.title,
        '--styles',
        plan.styles,
        '--force',
      ]),
    },
  ];
  if (plan.weaver) {
    steps.push({
      label: 'First weaver',
      describe: weaverDescription(plan.weaver),
      done: existsSync(join(root, 'libs', `${plan.weaver}-weaver`)),
      command: generator('weaver', [
        '--id',
        plan.weaver,
        '--command',
        '--app',
        app.name,
      ]),
    });
  }
  return steps;
}

function installSteps(plan: Plan): Step[] {
  return [
    {
      label: 'Install',
      describe: plan.runtime.join(' '),
      done: plan.runtime.length === 0,
      command: installCommand(plan.manager, plan.runtime, false),
    },
    {
      label: 'Install for development',
      describe: plan.dev.join(' '),
      done: plan.dev.length === 0,
      command: installCommand(plan.manager, plan.dev, true),
    },
  ];
}

function weaverDescription(id: string): string {
  return `"${id}" with a command on mod+shift+${id.charAt(0)}`;
}

function serveCommand(plan: Plan): string {
  if (plan.workspace.kind === 'nx') {
    return execCommand(plan.manager, [
      'nx',
      'serve',
      plan.app?.name ?? '',
    ]).join(' ');
  }
  return runScriptCommand(plan.manager, 'start');
}

function chooseApplication(
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

function weaverId(args: ParsedArgs): string | undefined {
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

function readManifest(root: string): Manifest {
  const file = join(root, 'package.json');
  return existsSync(file) ? (readJsonFile(file) as Manifest) : {};
}

function serviceWorkerSpec(root: string, manifest: Manifest): string {
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

function collectionSpec(version: string): string {
  return version === '0.0.0'
    ? `${NX_COLLECTION}@latest`
    : `${NX_COLLECTION}@${version}`;
}

function composesShell(file: string): boolean {
  return (
    existsSync(file) && readFileSync(file, 'utf8').includes('provideShell(')
  );
}

function kebab(value: string): string {
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

function titleCase(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
