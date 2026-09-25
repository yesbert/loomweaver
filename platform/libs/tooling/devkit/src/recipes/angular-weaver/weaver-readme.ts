import type { ResolvedWeaver } from './weaver-input';
import { quotedList } from '../../lib/amend/compose';
import { CONTAINER_EXAMPLE_ID } from './weaver-plugin';
import { PLATFORM_VERSION } from '../platform-version';
import { AG_UI_PROTOCOL_VERSION } from './agent-files';
import { asBullet, UNTAGGED_NOTE } from '../readme-notes';

function surfaceNotes(weaver: ResolvedWeaver): readonly string[] {
  const railNote =
    'Rail and bar items reference region ids (`primary` rail, `status-bar` bar) that must exist in your layout.';
  if (weaver.features.container) {
    return [
      `The surface is a **container**: it is routable at \`/${weaver.id}/:id\`, and its tab holds a`,
      'nested pane tree of child surfaces. The host draws the inner tabs, splits and drag targets; this',
      'weaver only declares which children it offers.',
      '',
      `- \`children\` is what the inner "new tab" picker lists — the host access-gates it for you.`,
      '- `initial` is what a freshly opened container tab starts with.',
      `- The children declare \`docks: []\`. That is the container-only convention: they are never seeded`,
      '  into a sidebar, they exist solely inside this container.',
      `- Each child reads the container's \`:id\` from an injected \`ActivatedRoute\` — the host supplies a`,
      '  synthetic one, so a child needs no knowledge of where it is mounted. Two open container tabs are',
      '  two independent trees, each scoped to its own id.',
      `- The inner tree is **sealed**: a child cannot be dragged out, and nothing can be dragged in. It`,
      '  travels with the tab, including into a sidebar or a pop-out window.',
      '',
      `The rail item opens the fixed id \`${CONTAINER_EXAMPLE_ID}\`. Replace that with whatever the user`,
      'actually picked — a document, a run, a project.',
      '',
      railNote,
    ];
  }
  if (weaver.features.instanceable) {
    return [
      `The surface is **docked** into the \`left-panel\` region and marked \`instanceable\`, so the host shows a`,
      'switcher for saving, naming, renaming and deleting several configurations of it, each with its own',
      '`VIEW_STATE` blob.',
      '',
      'It is deliberately **not** routable. Named instances exist only for a docked surface — a routable',
      'one holds the URL pane instead, and the host drops `instanceable` on that path. The rail item',
      'therefore reveals the surface (`ctx.revealSurface`) rather than navigating to a URL, which focuses',
      'it wherever the user has since moved it.',
      '',
      'The generated view already uses that blob for its sort order, because a hidden surface is destroyed',
      'as soon as it is clean: state kept in a component field survives neither a tab switch nor',
      'a collapsed sidebar, and never survived a reload. The rule is *evictable = reload-safe* — anything',
      'that must not be lost goes through `VIEW_STATE`, and `set()` replaces the whole blob, so spread it.',
      '',
      railNote,
    ];
  }
  return [
    `The surface is routable at \`/${weaver.id}\`; ${railNote.charAt(0).toLowerCase()}${railNote.slice(1)}`,
    '',
    'A routable surface has **no `VIEW_STATE` handle** — injecting the token there throws. It owns a URL,',
    'so anything shareable (a filter, the active sub-tab) belongs in route params or `subRoutes`, where it',
    'survives a deep link too; unsaved edits are `DirtySurface`, and an instance that is expensive to',
    "rebuild declares `retain: 'always'`. Generate with `--instanceable` for the docked, `VIEW_STATE`",
    'flavour instead.',
  ];
}

function agentNotes(weaver: ResolvedWeaver): readonly string[] {
  return [
    '',
    '## The agent connection',
    '',
    `\`src/lib/agent/\` holds three files and one of them is meant to be thrown away.`,
    '',
    `- \`${weaver.id}-connection.ts\` is the connection: the workbench's own commands offered as tools, and a`,
    '  seam where this weaver decides about a call before it runs. Nothing is registered twice — the',
    '  list comes from the workbench, already narrowed by everything that would refuse the call.',
    `- \`${weaver.id}-agent-panel.ts\` shows what is offered, the call as it streams, and the outcome.`,
    `- \`${weaver.id}-agent.ts\` is a **stand-in** for the agent, not an assistant: it produces the protocol's own`,
    '  events so the whole path runs before you have connected anything. Replace that one file with',
    '  your transport and nothing else changes. No transport, credential or model is generated for',
    '  you, because none of them can be guessed.',
    '',
    'Three things are easy to get wrong and invisible when they are, so the generated code does them',
    'rather than explaining them: the offered list is asked for again every run, every event is handed',
    'over unfiltered, and a decision before a call can only narrow what the workbench would have',
    'allowed anyway.',
    '',
    `The generated weaver needs two packages your project may not carry yet:`,
    '',
    '```bash',
    `npm i @loomweaver/ag-ui@^${PLATFORM_VERSION} @ag-ui/core@${AG_UI_PROTOCOL_VERSION}`,
    '```',
    '',
    'The Nx generator and the CLI record them for you; the MCP route names them instead.',
  ];
}

export function readmeFile(weaver: ResolvedWeaver): string {
  return [
    `# ${weaver.name} weaver`,
    '',
    `A LoomWeaver weaver (a domain plugin bundle). It consumes only the public \`@loomweaver/plugin-sdk\` contract.`,
    '',
    '## Wire it into a distribution',
    '',
    `1. Add the plugin to \`providePlugins\` in \`src/app/app.config.ts\`. It is **variadic** and`,
    `   returns an array, so spread it:`,
    '',
    '   ```ts',
    `   import { ${weaver.propertyName}Plugin } from '${weaver.importPath}';   // Nx: the workspace alias; without one, a relative path to this library's src/index.ts`,
    `   ...providePlugins(${weaver.propertyName}Plugin),`,
    '   ```',
    '',
    `2. Grant its capabilities (default-deny) via \`provideCapabilityGrants\`:`,
    '',
    '   ```ts',
    `   provideCapabilityGrants({ '${weaver.id}': [${quotedList(weaver.capabilities)}] });`,
    '   ```',
    '',
    `3. Compose its translations with \`provideTranslationNamespaces('${weaver.id}')\` — and serve the`,
    `   bundle by adding an assets glob to your application's build target, so the loader can fetch`,
    `   \`/i18n/${weaver.id}/<lang>.json\` (the Nx generator adds this glob for you):`,
    '',
    '   ```json',
    `   { "glob": "**/*.json", "input": "<path to this library>/src/lib/i18n", "output": "i18n/${weaver.id}" }`,
    '   ```',
    '',
    `4. If your application compiles the shell's theme with Tailwind, name this library as a source`,
    `   for it, so the utility classes in these templates are emitted. Tailwind also detects sources`,
    `   by itself, but that depends on where it resolves the project root and on \`.gitignore\`, and`,
    `   what the scaffold names covers the application alone (the Nx generator adds this line for`,
    `   you). Applications scaffolded with \`--styles precompiled\` run no Tailwind and need nothing:`,
    '',
    '   ```css',
    `   @source '<path from that stylesheet to this library>/src';`,
    '   ```',
    '',
    ...surfaceNotes(weaver),
    ...(weaver.features.agent ? agentNotes(weaver) : []),
    '',
    '## After scaffolding',
    '',
    '- `src/lib/i18n/de.json` starts as a copy of the English strings — translate it.',
    `- A scaffolded command defaults its shortcut to \`mod+shift+<first letter of the id>\` — two weavers whose ids share a first letter collide; pass \`--shortcut\` or edit the command.`,
    ...asBullet(UNTAGGED_NOTE),
    '',
  ].join('\n');
}
