#!/usr/bin/env node
/**
 * The generators record the packages they ask a consumer to install as literals: a recipe is a pure
 * function that produces text, and it cannot read a package manifest at the moment the text is
 * written. The frame kit for a distribution and the agent adapter for a weaver are asked for at the
 * platform version literal; the protocol package the adapter needs at a literal range of its own.
 *
 * A literal drifts silently. Bump the platform's version line and the generators keep asking for the
 * packages they were written against; widen the adapter's own peer range and generated output
 * resolves a second copy of the protocol package, whose events are not the events the first one
 * switches on. Neither shows up in a build here, because nothing here installs what a consumer
 * installs.
 *
 * So this compares the literals with what the shell and the adapter themselves declare.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const RECIPE = 'libs/tooling/devkit/src/recipes/angular-weaver/agent-files.ts';
const PLATFORM_RECIPE = 'libs/tooling/devkit/src/recipes/platform-version.ts';
const ADAPTER = 'libs/integrations/ag-ui/package.json';
const SHELL = 'libs/core/shell/package.json';

const source = readFileSync(join(root, RECIPE), 'utf8');
const platformSource = readFileSync(join(root, PLATFORM_RECIPE), 'utf8');
const adapter = JSON.parse(readFileSync(join(root, ADAPTER), 'utf8'));
const shell = JSON.parse(readFileSync(join(root, SHELL), 'utf8'));

const literal = (name) =>
  source.match(new RegExp(String.raw`${name}\s*=\s*'([^']+)'`))?.[1];

const recorded = {
  protocol: literal('AG_UI_PROTOCOL_VERSION'),
  platform: platformSource.match(/PLATFORM_VERSION\s*=\s*'([^']+)'/)?.[1],
};

if (!recorded.protocol) {
  console.error(`check-agent-versions: read no version from ${RECIPE} — it changed shape.`);
  process.exit(1);
}
if (!recorded.platform) {
  console.error(`check-agent-versions: read no version from ${PLATFORM_RECIPE} — it changed shape.`);
  process.exit(1);
}

const resolved = {
  adapter: adapter.version,
  protocol: adapter.peerDependencies?.['@ag-ui/core'],
};

const failures = [];
if (recorded.platform !== resolved.adapter) {
  failures.push(
    `the weaver generator records @loomweaver/ag-ui@${recorded.platform}, the platform publishes ${resolved.adapter} — ` +
      'a weaver generated now would ask for a version that is not this one.',
  );
}
if (recorded.platform !== shell.version) {
  failures.push(
    `the distribution generator records @loomweaver/frame-kit@${recorded.platform}, the platform publishes ${shell.version} — ` +
      'a distribution generated now would ask for a frame kit that is not this one.',
  );
}
if (recorded.protocol !== resolved.protocol) {
  failures.push(
    `the generator records @ag-ui/core@${recorded.protocol}, the adapter declares the peer range ${resolved.protocol} — ` +
      'two ranges resolve to two copies of the protocol package, and an event built by one is not the event the other switches on.',
  );
}

if (failures.length > 0) {
  console.error('check-agent-versions: the generated agent connection asks for the wrong versions.\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error(`\n  fix them in ${PLATFORM_RECIPE} and ${RECIPE}`);
  process.exit(1);
}

console.log(
  `check-agent-versions: the generators record @loomweaver/ag-ui@${recorded.platform}, @ag-ui/core@${recorded.protocol} and @loomweaver/frame-kit@${recorded.platform}, all as the platform resolves them.`,
);
