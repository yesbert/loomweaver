import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ParsedArgs, rejectUnknownFlags } from './args';
import { InitDeps, NX_COLLECTION, Plan, planInit } from './init-plan';
import {
  execCommand,
  installCommand,
  runScriptCommand,
} from './package-manager';
import type { Io } from './run';

const INIT_FLAGS = [
  'title',
  'styles',
  'weaver',
  'app',
  'package-manager',
  'dry-run',
];

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

function composesShell(file: string): boolean {
  return (
    existsSync(file) && readFileSync(file, 'utf8').includes('provideShell(')
  );
}

export type { InitDeps } from './init-plan';
