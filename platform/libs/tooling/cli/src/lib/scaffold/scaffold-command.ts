import { boolFlag, ParsedArgs, rejectUnknownFlags, stringFlag } from '../args';
import { AmendPlan, applyAmend, planAmend } from './amend';
import { Io } from '../io';
import {
  allowedFlagsFor,
  amendmentsFor,
  buildScaffold,
  findScaffold,
} from './scaffold';
import { applyWrite, planWrite } from './write';

function reportAmendments(io: Io, amend: AmendPlan, done: boolean): void {
  if (amend.amendments.length > 0) {
    io.out(
      done
        ? `Wired ${amend.amendments.length} workspace file(s):`
        : `Would wire ${amend.amendments.length} workspace file(s):`,
    );
    for (const amendment of amend.amendments) {
      io.out(`  ${amendment.display}`);
      for (const entry of amendment.added) {
        io.out(`    + ${entry}`);
      }
    }
  }
  if (amend.remaining.length > 0) {
    io.out('Still to do by hand:');
    for (const entry of amend.remaining) {
      io.out(`  - ${entry}`);
    }
  }
}

export function scaffold(args: ParsedArgs, io: Io): number {
  const descriptor = findScaffold(args.command);
  rejectUnknownFlags(args, [
    ...allowedFlagsFor(descriptor),
    'out',
    'dry-run',
    'force',
  ]);
  const files = buildScaffold(descriptor, args);
  const out = stringFlag(args, 'out') ?? '.';
  const plan = planWrite(files, out);
  const paths = plan.files.map((file) => file.path);
  const amend = planAmend(amendmentsFor(descriptor, args), out);

  if (boolFlag(args, 'dry-run')) {
    io.out(`Would write ${paths.length} file(s) into ${plan.root}:`);
    for (const path of paths) {
      io.out(`  ${path}`);
    }
    if (plan.conflicts.length > 0) {
      io.out(
        `${plan.conflicts.length} of them already exist and would need --force:`,
      );
      for (const path of plan.conflicts) {
        io.out(`  ${path}`);
      }
    }
    reportAmendments(io, amend, false);
    return 0;
  }

  if (plan.conflicts.length > 0 && !boolFlag(args, 'force')) {
    io.err(
      `${plan.conflicts.length} file(s) already exist; pass --force to overwrite:`,
    );
    for (const path of plan.conflicts) {
      io.err(`  ${path}`);
    }
    return 1;
  }

  applyWrite(files, plan);
  applyAmend(amend);
  io.out(`Wrote ${paths.length} file(s) into ${plan.root}:`);
  for (const path of paths) {
    io.out(`  ${path}`);
  }
  reportAmendments(io, amend, true);
  return 0;
}
