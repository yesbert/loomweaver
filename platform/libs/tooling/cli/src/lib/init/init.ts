import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FileMap,
  joinProjectPath,
  nxWeaverRoot,
  resolveWeaverInput,
} from '@loomweaver/devkit';
import { parseArgs, ParsedArgs, rejectUnknownFlags } from '../args';
import { findScaffold, scaffoldValues } from '../scaffold/scaffold';
import { planWrite } from '../scaffold/write';
import { WorkspaceError } from '../workspace';
import { InitDeps, NX_COLLECTION, InitPlan, planInit } from './init-plan';
import { stillAsGenerated } from './generated-files';
import { nxTrial } from './nx-trial';
import {
  execCommand,
  installCommand,
  runScriptCommand,
} from './package-manager';
import type { Io } from '../io';

export const INIT_FLAGS = [
  'title',
  'styles',
  'weaver',
  'app',
  'package-manager',
  'dry-run',
];

interface StepBase {
  readonly label: string;
  readonly describe: string;
  readonly done: boolean;
}

interface ExecStep extends StepBase {
  readonly kind: 'exec';
  readonly command: readonly string[];
  readonly touches?: readonly string[];
}

interface ScaffoldStep extends StepBase {
  readonly kind: 'scaffold';
  readonly argv: readonly string[];
  readonly after?: string;
}

type Step = ExecStep | ScaffoldStep;

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

function perform(step: Step, plan: InitPlan, io: Io, deps: InitDeps): number {
  switch (step.kind) {
    case 'exec': {
      return performExec(step, plan, io, deps);
    }
    case 'scaffold': {
      return performScaffold(step, plan, io, deps);
    }
  }
}

function performExec(
  step: ExecStep,
  plan: InitPlan,
  io: Io,
  deps: InitDeps,
): number {
  if (plan.dryRun) {
    io.out(`Would run: ${step.command.join(' ')}`);
    for (const touched of step.touches ?? []) {
      io.out(`  ${touched}`);
    }
    return 0;
  }
  io.out(`${step.label}: ${step.describe}`);
  deps.exec(step.command, plan.workspace.root);
  return 0;
}

function performScaffold(
  step: ScaffoldStep,
  plan: InitPlan,
  io: Io,
  deps: InitDeps,
): number {
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

function report(io: Io, plan: InitPlan): void {
  const where =
    plan.workspace.kind === 'nx'
      ? `Nx workspace, application ${plan.app?.name}`
      : 'Angular CLI application';
  io.out(
    `${plan.dryRun ? 'Would take' : 'Taking'} ${plan.workspace.root} to a product: ${where}, packages with ${managerLabel(plan)}.`,
  );
}

function managerLabel(plan: InitPlan): string {
  if (plan.lockfile) {
    return `${plan.manager} (from ${plan.lockfile})`;
  }
  if (plan.manager === 'npm') {
    return 'npm (no lockfile found, so npm)';
  }
  return plan.manager;
}

function stepsFor(plan: InitPlan): Step[] {
  return plan.workspace.kind === 'nx' ? nxSteps(plan) : angularSteps(plan);
}

function angularSteps(plan: InitPlan): Step[] {
  const root = plan.projectRoot;
  const distribution: ScaffoldStep = {
    label: 'Distribution',
    describe: `scaffold the composition root for "${plan.title}" (${plan.styles}) and wire the build`,
    done: composesShell(join(root, 'src/app/app.config.ts')),
    kind: 'scaffold',
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
  };
  if (!distribution.done) {
    refuseToReplaceChangedFiles(scaffoldFiles(distribution.argv), {
      directory: root,
      wrote: 'ng new',
      shown: (path) => path,
    });
  }
  const steps: Step[] = [...installSteps(plan), distribution];
  if (plan.weaver) {
    steps.push({
      label: 'First weaver',
      describe: weaverDescription(plan.weaver),
      done: existsSync(join(root, 'src', plan.weaver, 'src/index.ts')),
      after:
        'planned against the composition root as it is now; once the distribution step has run, the weaver composes into it',
      kind: 'scaffold',
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

function nxSteps(plan: InitPlan): Step[] {
  const root = plan.workspace.root;
  const app = plan.app;
  if (!app) {
    return [];
  }
  const generator = (name: string, argv: readonly string[]) =>
    execCommand(plan.manager, ['nx', 'g', `${NX_COLLECTION}:${name}`, ...argv]);
  const values = { name: app.name, title: plan.title, styles: plan.styles, directory: app.root };
  const composed = composesShell(join(root, app.root, 'src/app/app.config.ts'));
  const replaced = composed ? undefined : findScaffold('distribution').build(values);
  if (replaced) {
    refuseToReplaceChangedFiles(replaced, {
      directory: join(root, app.root),
      wrote: 'the Nx application generator',
      shown: (path) => joinProjectPath(app.root, path),
    });
  }
  const trial = plan.dryRun
    ? nxTrial(root, app, replaced, [...plan.runtime, ...plan.dev])
    : undefined;
  const steps: Step[] = [
    ...installSteps(plan),
    {
      label: 'Distribution',
      describe: `nx g ${NX_COLLECTION}:distribution over ${app.name} for "${plan.title}" (${plan.styles})`,
      done: composed,
      kind: 'exec',
      touches: trial?.distribution(values),
      command: generator('distribution', [
        '--name',
        app.name,
        '--directory',
        app.root || '.',
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
      done: existsSync(join(root, nxWeaverRoot(plan.weaver))),
      kind: 'exec',
      touches: trial?.weaver(plan.weaver),
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

function installSteps(plan: InitPlan): Step[] {
  const touches = [
    'changes package.json',
    ...(plan.lockfile ? [`changes ${plan.lockfile}`] : []),
  ];
  return [
    {
      label: 'Install',
      describe: plan.runtime.join(' '),
      done: plan.runtime.length === 0,
      kind: 'exec',
      touches,
      command: installCommand(plan.manager, plan.runtime, false),
    },
    {
      label: 'Install for development',
      describe: plan.dev.join(' '),
      done: plan.dev.length === 0,
      kind: 'exec',
      touches,
      command: installCommand(plan.manager, plan.dev, true),
    },
  ];
}

function weaverDescription(id: string): string {
  const { shortcut } = resolveWeaverInput({
    id,
    features: { command: true },
  }).features;
  return `"${id}" with a command on ${shortcut}`;
}

function serveCommand(plan: InitPlan): string {
  if (plan.workspace.kind === 'nx') {
    return execCommand(plan.manager, [
      'nx',
      'serve',
      plan.app?.name ?? '',
    ]).join(' ');
  }
  return runScriptCommand(plan.manager, 'start');
}

interface Occupied {
  readonly directory: string;
  readonly wrote: string;
  shown(path: string): string;
}

function scaffoldFiles(argv: readonly string[]): FileMap {
  const args = parseArgs(argv);
  const scaffold = findScaffold(args.command);
  return scaffold.build(scaffoldValues(scaffold, args));
}

function refuseToReplaceChangedFiles(files: FileMap, occupied: Occupied): void {
  const root = occupied.directory;
  const changed = planWrite(files, root)
    .conflicts.filter(
      (path) => !stillAsGenerated(path, readFileSync(join(root, path), 'utf8')),
    )
    .map((path) => occupied.shown(path));
  if (changed.length > 0) {
    throw new WorkspaceError(
      `The distribution replaces ${changed.join(', ')}, which ${changed.length === 1 ? 'is' : 'are'} no longer what ${occupied.wrote} wrote, so nothing was installed or written. ` +
        `Move ${changed.length === 1 ? 'it' : 'them'} aside or undo the changes and run init again; "loomweaver distribution --out ${root} --dry-run" shows everything it writes.`,
    );
  }
}

function composesShell(file: string): boolean {
  return (
    existsSync(file) && readFileSync(file, 'utf8').includes('provideShell(')
  );
}
