#!/usr/bin/env node
// Fails when a scaffold emits output that does not compile against the published contract.
//
// The scaffolding specification promises output that builds and needs no repair. String matches in
// the recipes' own tests cannot keep that promise: a recipe can call an export the contract renamed
// and every test stays green. So this generates every scaffold across its features, composes them
// into a generated distribution the way the routes do, and then:
//
//   - type-checks every emitted TypeScript file against the PACKED declarations of the SDK, the
//     shell and the agent connection, the files a consumer's compiler reads;
//   - parses every emitted Angular template with the Angular compiler;
//   - parses every emitted stylesheet;
//   - runs the frame plugin's scripts against stand-ins of the frame kit and the RPC host that offer
//     exactly what the kit declares and the host answers, so a call to anything else fails.
//
// Run it after packaging: `nx package plugin-sdk`, `nx package shell`, `nx package devkit`,
// `nx package ag-ui` and `nx bundle frame-kit`.

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import postcss from 'postcss';
import ts from 'typescript';
import { PUBLISHED_PACKAGES } from '../published-packages.mjs';

const platformRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);

const PACKAGES = Object.fromEntries(PUBLISHED_PACKAGES.map((pkg) => [pkg.name, pkg]));
const BUILT = {
  '@loomweaver/plugin-sdk': 'nx package plugin-sdk',
  '@loomweaver/shell': 'nx package shell',
  '@loomweaver/ag-ui': 'nx package ag-ui',
  '@loomweaver/devkit': 'nx package devkit',
  '@loomweaver/frame-kit': 'nx bundle frame-kit',
};
const missing = Object.entries(BUILT).filter(
  ([name]) => !existsSync(path.join(platformRoot, PACKAGES[name].types)),
);
if (missing.length > 0) {
  console.error(
    `check-generated-output: the packed declarations are not built. Run ${missing
      .map(([, step]) => `\`npx ${step}\``)
      .join(', ')} first.`,
  );
  process.exit(1);
}

const devkit = require(path.join(platformRoot, PACKAGES['@loomweaver/devkit'].publishRoot, 'src/index.js'));
const problems = [];

// Generated output lives under a folder inside platform/, so that what it imports from Angular,
// RxJS or the agent protocol resolves from the workspace's own node_modules exactly as it would in
// a consumer's. Nothing is written there; the files exist only in this map.
const FOLDER = 'generated-output';
const ROOT = path.join(platformRoot, FOLDER);
const files = new Map();

function place(directory, map) {
  for (const [relative, content] of Object.entries(map)) {
    files.set(path.join(ROOT, directory, relative), content);
  }
}

function scaffold(name, values, directory) {
  const descriptor = devkit.findScaffold(name);
  place(directory, descriptor.build(values));
  return descriptor.amend?.({ ...values, directory: `${FOLDER}/${directory}` }) ?? [];
}

// One weaver per feature, one with every feature that combines, and the two that exclude each
// other apart. Ids carry a hyphen on purpose: a grant keyed by one must still compile.
const WEAVERS = [
  ['w-plain', {}],
  ['w-command', { command: true, shortcut: 'mod+shift+y' }],
  ['w-menu', { menu: true }],
  ['w-bar-item', { barItem: true }],
  ['w-settings', { settings: true }],
  ['w-about', { about: true }],
  ['w-instanceable', { instanceable: true }],
  ['w-container', { container: true }],
  ['w-agent', { agent: true }],
  ['w-authenticated', { access: 'authenticated' }],
  ['w-anonymous', { access: 'anonymous' }],
  ['w-role', { access: 'role:admin' }],
  ['w-no-spec', { spec: false }],
  [
    'w-everything',
    {
      name: "Ops & 'Notes' {x}",
      command: true,
      menu: true,
      barItem: true,
      settings: true,
      about: true,
      instanceable: true,
      agent: true,
      access: 'role:ops',
    },
  ],
];

function composeInto(app, amendments) {
  const configFile = path.join(ROOT, app, 'src/app/app.config.ts');
  const appDirectory = `${FOLDER}/${app}/src/app`;
  for (const amendment of amendments) {
    const source = files.get(configFile);
    let result;
    if (amendment.kind === 'compose-plugin') {
      result = devkit.composePlugin(
        source,
        amendment,
        devkit.relativeImport(appDirectory, amendment.sourceRoot),
      );
    } else if (amendment.kind === 'compose-provider') {
      result = devkit.composeProviders(
        source,
        amendment,
        devkit.moduleImport(appDirectory, amendment.module),
      );
    } else {
      continue;
    }
    if (!result.composed) {
      problems.push(`${app}: the generated composition root no longer composes ${amendment.id ?? amendment.module ?? 'a provider'}`);
      continue;
    }
    files.set(configFile, result.source);
  }
}

const composed = [];
scaffold('distribution', { name: 'tailwind-app', styles: 'tailwind' }, 'tailwind-app');
scaffold('distribution', { name: 'precompiled-app', title: 'Precompiled "App"', styles: 'precompiled' }, 'precompiled-app');
for (const [id, features] of WEAVERS) {
  composed.push(...scaffold('weaver', { id, ...features }, `tailwind-app/src/${id}`));
}
composed.push(
  ...scaffold('auth-source', { name: 'dev' }, 'tailwind-app/src/auth'),
  ...scaffold('settings-store', { name: 'backend' }, 'tailwind-app/src/settings'),
  ...scaffold('layout', { name: 'wide' }, 'tailwind-app/src'),
  ...scaffold('frame-plugin', { id: 'field-notes', name: 'Field <Notes>' }, 'tailwind-app/public/field-notes'),
  ...scaffold('theme', { name: 'ocean' }, 'tailwind-app/src/themes'),
  ...scaffold('theme', { name: 'brand', preset: 'bootstrap' }, 'tailwind-app/src/themes'),
);
scaffold('auth-source', { name: 'bare', bare: true }, 'precompiled-app/src/auth');
composeInto('tailwind-app', composed);

const KINDS = {
  ts: (file) => file.endsWith('.ts'),
  css: (file) => file.endsWith('.css'),
};

function shown(file) {
  return path.relative(ROOT, file);
}

// The settings a consumer's compiler runs with: the Angular CLI's strict defaults, as the demo
// application carries them.
const OPTIONS = {
  strict: true,
  noImplicitOverride: true,
  noPropertyAccessFromIndexSignature: true,
  noImplicitReturns: true,
  noFallthroughCasesInSwitch: true,
  skipLibCheck: true,
  isolatedModules: true,
  experimentalDecorators: true,
  resolveJsonModule: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.Preserve,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  types: ['vitest/globals'],
  typeRoots: [path.join(platformRoot, 'node_modules/@types'), path.join(platformRoot, 'node_modules')],
  noEmit: true,
  paths: Object.fromEntries(
    ['@loomweaver/plugin-sdk', '@loomweaver/shell', '@loomweaver/ag-ui'].map((name) => [
      name,
      [path.join(platformRoot, PACKAGES[name].types)],
    ]),
  ),
};

function typeCheck() {
  const host = ts.createCompilerHost(OPTIONS);
  const readFile = host.readFile.bind(host);
  const fileExists = host.fileExists.bind(host);
  const getSourceFile = host.getSourceFile.bind(host);
  const directoryExists = host.directoryExists?.bind(host) ?? (() => true);
  host.fileExists = (file) => files.has(path.resolve(file)) || fileExists(file);
  host.directoryExists = (directory) =>
    path.resolve(directory).startsWith(ROOT) || directoryExists(directory);
  host.readFile = (file) => files.get(path.resolve(file)) ?? readFile(file);
  host.getSourceFile = (file, language) => {
    const text = files.get(path.resolve(file));
    return text === undefined ? getSourceFile(file, language) : ts.createSourceFile(file, text, language, true);
  };
  const roots = [...files.keys()].filter((file) => KINDS.ts(file));
  const program = ts.createProgram(roots, OPTIONS, host);
  for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    const where = diagnostic.file
      ? `${shown(diagnostic.file.fileName)}:${diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1}`
      : 'compiler';
    problems.push(`${where}: ${message}`);
  }
  return roots.length;
}

async function parseTemplates() {
  const { parseTemplate } = await import('@angular/compiler');
  const templates = [...files.keys()].filter((file) => file.endsWith('.html') && !file.endsWith('index.html') && !file.includes(`${path.sep}public${path.sep}`));
  for (const file of templates) {
    for (const error of parseTemplate(files.get(file), file, { preserveWhitespaces: false }).errors ?? []) {
      problems.push(`${shown(file)}: ${error.msg}`);
    }
  }
  return templates.length;
}

function parseStylesheets() {
  const sheets = [...files.keys()].filter((file) => KINDS.css(file));
  for (const file of sheets) {
    try {
      postcss.parse(files.get(file), { from: file });
    } catch (error) {
      problems.push(`${shown(file)}: ${error.reason ?? error.message}`);
    }
  }
  return sheets.length;
}

// What the frame kit offers, read from the declaration it ships, and what the RPC host answers,
// read from the contract the workbench implements. A stand-in offers exactly those members.
function interfaceMembers(file, name) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const members = new Map();
  const visit = (node) => {
    if ((ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) && node.name.text === name) {
      const list = ts.isInterfaceDeclaration(node)
        ? node.members
        : node.type.types?.flatMap((part) => (ts.isTypeLiteralNode(part) ? [...part.members] : [])) ?? [];
      for (const member of list) {
        if (member.name && ts.isIdentifier(member.name)) {
          members.set(member.name.text, ts.isPropertySignature(member) ? member.type?.getText(source) : 'method');
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return members;
}

function standIn(file, name, calls, label) {
  const members = interfaceMembers(file, name);
  if (members.size === 0) {
    problems.push(`${name} is not declared in ${path.relative(platformRoot, file)}; the stand-in cannot be built`);
  }
  const object = {};
  for (const [member, type] of members) {
    if (type === 'method') {
      object[member] = (...args) => {
        calls.push(`${label}.${member}`);
        return member === 'surfaceMethods' ? args[0] : undefined;
      };
    } else if (type && /^[A-Z]\w*$/.test(type)) {
      object[member] = standIn(file, type, calls, `${label}.${member}`);
    }
  }
  return Object.freeze(object);
}

// A script's failures arrive late, from inside the promise its connection resolves, so they are
// collected for whichever script is running when they surface.
let rejected = [];
process.on('unhandledRejection', (reason) => {
  rejected.push(reason instanceof Error ? reason.message : String(reason));
});

async function runFrameScripts() {
  const kit = path.join(platformRoot, PACKAGES['@loomweaver/frame-kit'].types);
  const contract = path.join(platformRoot, 'libs/core/shell/src/lib/plugin/frame/rpc/frame-rpc-contract.ts');
  const scripts = [];
  for (const [file, text] of files) {
    if (!file.includes(`${path.sep}public${path.sep}`)) continue;
    if (file.endsWith('.js')) scripts.push([shown(file), text]);
    if (file.endsWith('.html')) {
      for (const [index, match] of [...text.matchAll(/<script>([\s\S]*?)<\/script>/g)].entries()) {
        scripts.push([`${shown(file)} (inline script ${index + 1})`, match[1]]);
      }
    }
  }
  for (const [where, code] of scripts) {
    const calls = [];
    const rpcHost = standIn(contract, 'FrameRpc', calls, 'host');
    const failures = [];
    rejected = failures;
    const sandbox = {
      console: {
        error: (...args) => {
          failures.push(args.map(String).join(' '));
        },
        log: () => undefined,
        warn: () => undefined,
      },
      LwFrame: standIn(kit, 'LwFrameApi', calls, 'LwFrame'),
      Penpal: {
        WindowMessenger: class {},
        connect: () => ({ promise: Promise.resolve(rpcHost) }),
      },
      parent: {},
    };
    sandbox.globalThis = sandbox;
    try {
      vm.runInNewContext(code, sandbox, { filename: where });
      await new Promise((resolve) => setImmediate(resolve));
    } catch (error) {
      failures.push(error.message);
    }
    for (const failure of failures) {
      problems.push(`${where}: ${failure}`);
    }
    if (calls.length === 0 && failures.length === 0) {
      problems.push(`${where}: called nothing on the frame kit or the host, so it was not exercised`);
    }
  }
  return scripts.length;
}

const checked = {
  typescript: typeCheck(),
  templates: await parseTemplates(),
  stylesheets: parseStylesheets(),
  scripts: await runFrameScripts(),
};

if (problems.length > 0) {
  console.error('check-generated-output: generated output does not hold against the contract:');
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  process.exit(1);
}
console.log(
  `check-generated-output: ${WEAVERS.length} weavers and every other scaffold composed into two distributions; ` +
    `${checked.typescript} TypeScript files type-check against the packed declarations, ` +
    `${checked.templates} templates and ${checked.stylesheets} stylesheets parse, ` +
    `${checked.scripts} frame scripts run against the kit and the host.`,
);
