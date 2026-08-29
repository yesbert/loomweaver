#!/usr/bin/env node
/**
 * The weaver generator records two packages for the agent connection it emits, and it has to state
 * their versions as literals: the recipe is a pure function that produces text, and it cannot read a
 * package manifest at the moment the text is written.
 *
 * A literal drifts silently. Bump the platform's version line and the generator keeps asking for the
 * adapter it was written against; widen the adapter's own peer range and generated output resolves a
 * second copy of the protocol package, whose events are not the events the first one switches on.
 * Neither shows up in a build here, because nothing here installs what a consumer installs.
 *
 * So this compares the two literals with what the adapter itself declares.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const RECIPE = 'libs/tooling/devkit/src/recipes/angular-weaver/agent-files.ts';
const ADAPTER = 'libs/integrations/ag-ui/package.json';

const source = readFileSync(join(root, RECIPE), 'utf8');
const adapter = JSON.parse(readFileSync(join(root, ADAPTER), 'utf8'));

const literal = (name) =>
  source.match(new RegExp(String.raw`${name}\s*=\s*'([^']+)'`))?.[1];

const recorded = {
  adapter: literal('AG_UI_ADAPTER_VERSION'),
  protocol: literal('AG_UI_PROTOCOL_VERSION'),
};
const resolved = {
  adapter: adapter.version,
  protocol: adapter.peerDependencies?.['@ag-ui/core'],
};

if (!recorded.adapter || !recorded.protocol) {
  console.error(`check-agent-versions: read no version from ${RECIPE} — it changed shape.`);
  process.exit(1);
}

const failures = [];
if (recorded.adapter !== resolved.adapter) {
  failures.push(
    `the generator records @loomweaver/ag-ui@${recorded.adapter}, the platform publishes ${resolved.adapter} — ` +
      'a weaver generated now would ask for a version that is not this one.',
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
  console.error(`\n  fix them in ${RECIPE}`);
  process.exit(1);
}

console.log(
  `check-agent-versions: the generator records @loomweaver/ag-ui@${recorded.adapter} and @ag-ui/core@${recorded.protocol}, both as the platform resolves them.`,
);
