import {
  Amendment,
  describeAmendment,
  ensureDependency,
  ensurePostcssPlugin,
  PackageAmendment,
  PostcssAmendment,
} from '@loomweaver/devkit';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { findWorkspace, readJsonFile, Workspace } from '../workspace';
import { AmendLog, PlannedAmendment } from './amend-log';
import { ProjectAmendment, ProjectWiring } from './project-wiring';

export interface AmendPlan {
  readonly amendments: readonly PlannedAmendment[];
  readonly remaining: readonly string[];
}

const JS_POSTCSS_CONFIGS = [
  'postcss.config.js',
  'postcss.config.mjs',
  'postcss.config.cjs',
  '.postcssrc.js',
];

export function planAmend(
  amendments: readonly Amendment[],
  target: string,
): AmendPlan {
  if (amendments.length === 0) {
    return { amendments: [], remaining: [] };
  }
  const workspace = findWorkspace(target);
  if (!workspace) {
    return {
      amendments: [],
      remaining: [
        'No workspace was found above the target directory, so nothing could be wired here. Add it ' +
          `by hand, or generate inside the workspace: ${amendments.map((amendment) => describeAmendment(amendment)).join(' · ')}`,
      ],
    };
  }
  return new Amender(workspace, target).plan(amendments);
}

export function applyAmend(plan: AmendPlan): void {
  for (const amendment of plan.amendments) {
    writeFileSync(amendment.file, amendment.content, 'utf8');
  }
}

class Amender {
  private readonly log: AmendLog;
  private readonly manifestAdded: string[] = [];
  private manifest?: Record<string, unknown>;
  private wiring?: ProjectWiring;

  constructor(
    private readonly workspace: Workspace,
    private readonly target: string,
  ) {
    this.log = new AmendLog(workspace.root);
  }

  plan(amendments: readonly Amendment[]): AmendPlan {
    for (const amendment of amendments) {
      this.planOne(amendment);
    }
    this.wiring?.flush();
    this.flushManifest();
    return { amendments: this.log.planned, remaining: this.log.remaining };
  }

  private planOne(amendment: Amendment): void {
    switch (amendment.kind) {
      case 'postcss': {
        this.planPostcss(amendment);
        return;
      }
      case 'package': {
        this.planPackage(amendment);
        return;
      }
      default: {
        this.wire(amendment);
      }
    }
  }

  private wire(amendment: ProjectAmendment): void {
    if (this.workspace.kind !== 'angular') {
      this.log.note(this.nonAngularNote(amendment));
      return;
    }
    this.wiring ??= new ProjectWiring(this.workspace, this.target, this.log);
    this.wiring.plan(amendment);
  }

  private planPostcss(amendment: PostcssAmendment): void {
    const inTheWay = JS_POSTCSS_CONFIGS.find((name) =>
      existsSync(resolve(this.workspace.root, name)),
    );
    if (inTheWay) {
      this.log.note(
        `${inTheWay} is written as code and cannot be merged into, so add ${amendment.plugin} to it yourself; until then the stylesheet emits no utility class and the workbench renders unstyled.`,
      );
      return;
    }
    const file = resolve(this.workspace.root, amendment.file);
    const result = ensurePostcssPlugin(
      existsSync(file) ? readJsonFile(file) : undefined,
      amendment,
    );
    this.log.note(...result.declined);
    if (result.added.length === 0) {
      return;
    }
    this.log.plan(file, result.added, `${JSON.stringify(result.value, null, 2)}\n`);
  }

  private planPackage(amendment: PackageAmendment): void {
    const file = resolve(this.workspace.root, 'package.json');
    if (!existsSync(file)) {
      this.log.note(describeAmendment(amendment));
      return;
    }
    const manifest = this.manifest ?? readJsonFile(file);
    const result = ensureDependency(manifest, amendment);
    this.log.note(...result.declined);
    if (result.added.length === 0) {
      return;
    }
    this.manifest = result.value;
    this.manifestAdded.push(...result.added);
  }

  private flushManifest(): void {
    if (this.manifestAdded.length === 0 || !this.manifest) {
      return;
    }
    const file = resolve(this.workspace.root, 'package.json');
    this.log.plan(file, this.manifestAdded, `${JSON.stringify(this.manifest, null, 2)}\n`);
    this.log.note(
      `Install what was just recorded in ${this.log.displayName(file)} (${this.manifestAdded
        .map((entry) => entry.replace('dependencies: ', ''))
        .join(
          ', ',
        )}) — recording it is not installing it, and the build fails until you do.`,
    );
  }

  private nonAngularNote(amendment: Amendment): string {
    const where =
      this.workspace.kind === 'nx'
        ? "the project's own project.json"
        : 'your build configuration';
    return `This route wires an Angular CLI workspace only, so add ${describeAmendment(amendment)} to ${where} yourself. The Nx generator does it for you.`;
  }
}
