#!/usr/bin/env node
// Fails when a published export is not mentioned anywhere in the public documentation, or not named
// in llms-full.txt on its own, or is visible in the packed declarations without being exported.
//
// "Feature complete" is a claim that rots silently: a new export lands, the guide that would have
// explained it is never touched, and nothing notices. This reads the PACKED type declarations —
// the actual contract consumers see, not the source barrels, which export more than they publish —
// and requires every exported name to appear in docs/ or the llms files.
//
// Run it after `nx package plugin-sdk && nx package shell`.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { PUBLISHED_PACKAGES } from '../published-packages.mjs';
import { filesUnder } from './files-under.mjs';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);

// The libraries a product builds with. The tooling packages are run rather than imported, so their
// exports are not what the guides document. @loomweaver/frame-kit is a global script rather than a
// module: it is loaded by a script tag and installs itself, so what it publishes are ambient names.
const ENTRIES = Object.fromEntries(
  PUBLISHED_PACKAGES.filter((pkg) => pkg.role === 'library').map((pkg) => [
    pkg.name,
    `platform/${pkg.types}`,
  ]),
);

// Names a consumer can see in the packed declarations but cannot import: a type a public field is
// declared with, or a class a public constructor takes, that the barrel never re-exports. The rollup
// can carry more than the public surface reaches, so what counts is what the exports reach through
// their type references and the export list leaves out. Each one here is a decision still to be
// taken, export it or take it off the public surface, and a new one fails until it is taken.
const VISIBLE_BUT_NOT_EXPORTED = new Map([
  ['PANE_HANDLE', 'the phantom brand of PaneHandle: declared, never a value, nothing to import'],
]);

// Names that carry no prose of their own, with the reason each is exempt. Anything not listed here
// must be documented — adding a name to this list is a deliberate act, visible in review.
const EXEMPT = new Map([
  // Custom-element plumbing: the documented contract is the tag and its CSS classes, not the
  // class behind it (see reference/design-tokens.md). The registration functions are not exempt:
  // content rendered without a running shell needs them, so they are documented there.
  ['LW_BUTTON_TAG', 'element tag constant'],
  ['LW_ICON_TAG', 'element tag constant'],
  ['LW_MARKDOWN_TAG', 'element tag constant'],
  ['LW_TOOLTIP_TAG', 'element tag constant'],
  ['LW_NAV_TREE_TAG', 'element tag constant'],
  ['LW_NAV_GROUP_TAG', 'element tag constant'],
  ['LW_NAV_ITEM_TAG', 'element tag constant'],
  ['LW_NAV_SELECT', 'event name constant behind the documented lw-nav-select event'],
  ['LwButtonElement', 'class behind <lw-button>'],
  ['LwIconElement', 'class behind <lw-icon>'],
  ['LwMarkdownElement', 'class behind <lw-markdown>'],
  ['LwTooltipElement', 'class behind <lw-tooltip>'],
  ['LwNavTreeElement', 'class behind <lw-nav-tree>'],
  ['LwNavGroupElement', 'class behind <lw-nav-group>'],
  ['LwNavItemElement', 'class behind <lw-nav-item>'],
  ['LwButton', 'Angular directive behind the .lw-btn class contract'],
  ['LwVersion', 'component behind the documented version chrome'],
  ['LwSettingRow', 'component behind the documented settings rows'],
  ['TooltipPosition', 'attribute value type of <lw-tooltip>'],
  ['LwButtonSize', 'attribute value type of the button contract'],
  ['LwButtonVariant', 'attribute value type of the button contract'],
  // Injection tokens whose documented surface is the provide* function in front of them.
  ['BAR_ITEM', 'token behind provideBarItems'],
  ['RAIL_ITEM', 'token behind provideRailItems'],
  ['VIEW', 'token behind provideViews'],
  ['PLUGIN', 'token behind providePlugins'],
  ['FRAME_PLUGIN', 'token behind provideFramePlugins'],
  ['SHELL_LAYOUT', 'token behind provideLayout'],
  ['CAPABILITY_GRANTS', 'token behind provideCapabilityGrants'],
  ['REQUIRED_PLUGINS', 'token behind provideRequiredPlugins'],
  ['PLUGIN_CATALOG', 'token behind providePluginCatalog'],
  ['AUTH_SOURCE', 'token behind provideAuthSource'],
  ['TRANSLATION_NAMESPACES', 'token behind provideTranslationNamespaces'],
  ['TRANSLATION_OVERRIDES', 'token behind provideTranslationOverrides'],
  ['PRODUCT_IDENTITY', 'token behind provideProductIdentity'],
  ['VIEW_STATE', 'token documented as ctx-facing view state'],
  ['SETTINGS_STORE', 'token behind provideSettingsStore'],
  // Defaults and derived shapes the prose describes in words rather than by symbol name.
  ['DEFAULT_LAYOUT', 'the bare-platform fallback layout'],
  ['LOOMWEAVER_IDENTITY', 'the bare-platform fallback identity'],
  ['ANONYMOUS', 'documented in access-gating.md as the anonymous baseline'],
  // Internal-ish supporting types: reachable from a documented member's signature.
  ['DialogInstance', 'internal shape of the dialog outlet'],
  ['DialogButtonView', 'internal shape of a rendered dialog button'],
  ['Notification', 'rendered form of NotificationInput'],
  ['PluginCapabilityState', 'row shape of the permissions surface'],
  ['PluginInfo', 'row shape of the plugin list'],
  ['PluginPermissions', 'row shape of the permissions surface'],
  ['RegisteredContentRoute', 'a ContentRoute plus the host-stamped plugin id'],
  ['RegisteredView', 'a View plus the host-stamped plugin id'],
  ['ContentRouteBase', 'shared half of the ContentRoute union'],
  ['SurfaceBase', 'shared half of the Surface contract'],
  ['UnauthorizedHandler', 'callback type of provideUnauthorizedRedirect'],
  ['DockPosition', 'value type of LayoutRegion.dock'],
  ['RegionType', 'value type of LayoutRegion.type'],
  ['ShellOptions', 'options object of provideShell'],
  ['AuthSourceOptions', 'options object of provideAuthSource'],
  [
    'CommandPaletteEntryOptions',
    'options object of provideCommandPaletteEntry',
  ],
  ['QuickOpenEntryOptions', 'options object of provideQuickOpenEntry'],
  ['PluginCatalogOptions', 'options object of providePluginCatalog'],
  ['CapabilityGrants', 'map shape of provideCapabilityGrants'],
  ['RequiredPlugins', 'list shape of provideRequiredPlugins'],
  ['ContentTabView', 'rendered form of a content tab'],
  ['SelectOption', 'option shape of the select control'],
  // The settings control kinds are documented by their `kind:` value, which is what an author writes.
  ['SettingToggle', 'type behind kind: "toggle"'],
  ['SettingText', 'type behind kind: "text"'],
  ['SettingSelect', 'type behind kind: "select"'],
  ['SettingSlider', 'type behind kind: "slider"'],
  ['SettingButton', 'type behind kind: "button"'],
  ['SettingComponent', 'type behind kind: "component"'],
  // Documented by their field on the options object they belong to.
  ['DialogButton', 'element type of OpenOptions.buttons'],
  ['RequireConfirmation', 'type of ConfirmOptions.requireConfirmation'],
  ['DialogSize', 'value type of OpenOptions.size'],
  ['DialogTone', 'value type of the dialog tone'],
  ['NotificationKind', 'value type of NotificationInput.kind'],
  ['NotificationAction', 'action shape of a toast'],
  ['BarSlot', 'value type of BarItem.slot'],
  ['isAccessVisible', 'pure helper behind the documented hide semantics'],
  ['isAccessDisabled', 'pure helper behind the documented disable semantics'],
  ['meetsAccess', 'pure helper behind the documented requirement semantics'],
  ['effectiveCapabilities', 'pure helper: grant ∩ declaration'],
  ['CapabilityError', 'documented by behaviour in plugins.md'],
  ['Disposable', 'the return of every register* call'],
  ['Shell', 'the root component, used in every getting-started example'],
  ['DialogOutlet', 'rendered by Shell; named in docs/distribution-api/index.md'],
  ['ToastOutlet', 'rendered by Shell; named in docs/distribution-api/index.md'],
  ['UpdateBadge', 'chrome component composed by id'],
]);

function docsBlob() {
  const files = filesUnder(path.join(repoRoot, 'docs'), { keep: (name) => name.endsWith('.md') });
  for (const extra of ['llms.txt', 'llms-full.txt', 'README.md']) {
    const full = path.join(repoRoot, extra);
    if (existsSync(full)) files.push(full);
  }
  return files.map((f) => readFileSync(f, 'utf8')).join('\n');
}

function exportedNames(entry) {
  const program = ts.createProgram([entry], {
    noResolve: false,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
  });
  const source = program.getSourceFile(entry);
  if (!source) throw new Error(`cannot read ${entry}`);
  const symbol = program.getTypeChecker().getSymbolAtLocation(source);
  if (symbol) {
    return program
      .getTypeChecker()
      .getExportsOfModule(symbol)
      .map((s) => s.getName())
      .toSorted((a, b) => a.localeCompare(b));
  }

  // No module symbol means the file is a global script, and then everything it declares at the top
  // level is what a consumer can name. That is a published surface too, and the reason this
  // checker cannot simply read exports.
  const names = [];
  ts.forEachChild(source, (node) => {
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.push(declaration.name.text);
      }
      return;
    }
    if (node.name && ts.isIdentifier(node.name)) names.push(node.name.text);
  });
  return names.toSorted((a, b) => a.localeCompare(b));
}

// The rollup's top-level declarations by local name. A name can be declared more than once, an
// interface merged or a function overloaded, and every declaration counts.
function topLevelDeclarations(source) {
  const declarations = new Map();
  const add = (name, node) =>
    declarations.set(name, [...(declarations.get(name) ?? []), node]);
  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) add(declaration.name.text, declaration);
      }
    } else if (
      (ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isFunctionDeclaration(statement) ||
        ts.isEnumDeclaration(statement) ||
        ts.isModuleDeclaration(statement)) &&
      statement.name &&
      ts.isIdentifier(statement.name)
    ) {
      add(statement.name.text, statement);
    }
  }
  return declarations;
}

// The local names the rollup exports, by modifier or through an export list.
function exportedLocals(source) {
  const locals = new Set();
  for (const statement of source.statements) {
    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        locals.add((element.propertyName ?? element.name).text);
      }
      continue;
    }
    const exportedHere = ts.getModifiers?.(statement)?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!exportedHere) continue;
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) locals.add(declaration.name.text);
      }
    } else if (statement.name && ts.isIdentifier(statement.name)) {
      locals.add(statement.name.text);
    }
  }
  return locals;
}

function leftmost(name) {
  return ts.isQualifiedName(name) ? leftmost(name.left) : name;
}

// The names a declaration refers to where a consumer meets them: a type it is written with, a
// `typeof`, a class it extends or implements, and a computed key such as a phantom brand.
function referencedNames(node) {
  const names = new Set();
  const visit = (child) => {
    if (ts.isTypeReferenceNode(child)) names.add(leftmost(child.typeName).text);
    else if (ts.isTypeQueryNode(child)) names.add(leftmost(child.exprName).text);
    else if (
      (ts.isExpressionWithTypeArguments(child) || ts.isComputedPropertyName(child)) &&
      ts.isIdentifier(child.expression)
    ) {
      names.add(child.expression.text);
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  return names;
}

// What the exports reach and the export list leaves out. A declaration nothing public refers to is
// not counted: a bundler may keep it, but no public type leads a consumer to it.
function leakedNames(entry) {
  const source = ts.createSourceFile(entry, readFileSync(entry, 'utf8'), ts.ScriptTarget.Latest, true);
  const declarations = topLevelDeclarations(source);
  const exported = exportedLocals(source);
  const reached = new Set();
  const pending = [...exported].filter((name) => declarations.has(name));
  while (pending.length > 0) {
    const name = pending.pop();
    if (reached.has(name)) continue;
    reached.add(name);
    for (const node of declarations.get(name)) {
      for (const referenced of referencedNames(node)) {
        if (declarations.has(referenced) && !reached.has(referenced)) pending.push(referenced);
      }
    }
  }
  return [...reached].filter((name) => !exported.has(name)).toSorted((a, b) => a.localeCompare(b));
}

const blob = docsBlob();
// llms-full.txt calls itself the whole contract, so the union is not enough for it: a name that
// lives on a reference page and nowhere in this file passes the union and fails the claim.
const llmsFull = readFileSync(path.join(repoRoot, 'llms-full.txt'), 'utf8');
const missingFromLlms = [];
const missing = [];
const allExported = new Set();
const leaked = [];
const seenLeaked = new Set();
let checked = 0;

for (const [package_, relative] of Object.entries(ENTRIES)) {
  const entry = path.join(repoRoot, relative);
  if (!existsSync(entry)) {
    console.error(
      `check-api-docs: ${relative} is missing — run \`nx package plugin-sdk && nx package shell\` first.`,
    );
    process.exit(2);
  }
  const exported = new Set(exportedNames(entry));
  for (const name of exported) {
    checked++;
    allExported.add(name);
    if (EXEMPT.has(name)) continue;
    const named = new RegExp(String.raw`\b${name}\b`);
    if (!named.test(llmsFull)) missingFromLlms.push(`${package_} · ${name}`);
    if (named.test(blob)) continue;
    missing.push(`${package_} · ${name}`);
  }
  if (relative.endsWith('.d.ts') && relative.includes('/types/')) {
    for (const name of leakedNames(entry)) {
      seenLeaked.add(name);
      if (VISIBLE_BUT_NOT_EXPORTED.has(name)) continue;
      leaked.push(`${package_} · ${name}`);
    }
  }
}

const settled = [...VISIBLE_BUT_NOT_EXPORTED.keys()].filter((name) => !seenLeaked.has(name));
if (settled.length > 0) {
  console.error(
    `check-api-docs: ${settled.length} ${settled.length === 1 ? 'entry' : 'entries'} in VISIBLE_BUT_NOT_EXPORTED no longer describe the packed declarations:\n` +
      settled.map((name) => `  - ${name}`).join('\n') +
      '\n\nRemove them from VISIBLE_BUT_NOT_EXPORTED in tools/checks/check-api-docs.mjs.',
  );
  process.exit(1);
}

if (leaked.length > 0) {
  console.error(
    `check-api-docs: ${leaked.length} declaration(s) a consumer can see but cannot import:\n` +
      leaked.map((m) => `  - ${m}`).join('\n') +
      '\n\nExport them from the barrel, or take them off the public surface.',
  );
  process.exit(1);
}

// An exemption for a symbol that no longer ships is invisible drift: it reads like a decision but
// governs nothing, and the next reader takes it for the current contract.
const stale = [...EXEMPT.keys()].filter((name) => !allExported.has(name));
if (stale.length > 0) {
  console.error(
    `check-api-docs: ${stale.length} exemption(s) name a symbol that is no longer published:\n` +
      stale.map((name) => `  - ${name}`).join('\n') +
      '\n\nRemove them from EXEMPT in tools/checks/check-api-docs.mjs.',
  );
  process.exit(1);
}

if (missingFromLlms.length > 0) {
  console.error(
    `check-api-docs: ${missingFromLlms.length} published export(s) are not named in llms-full.txt, which calls itself the whole contract:\n` +
      missingFromLlms.map((m) => `  - ${m}`).join('\n') +
      '\n\nName them in llms-full.txt, or add them to EXEMPT in tools/checks/check-api-docs.mjs with a reason.',
  );
  process.exit(1);
}

if (missing.length > 0) {
  console.error(
    `check-api-docs: ${missing.length} published export(s) appear nowhere in the documentation:\n` +
      missing.map((m) => `  - ${m}`).join('\n') +
      '\n\nDocument them, or add them to EXEMPT in tools/checks/check-api-docs.mjs with a reason.',
  );
  process.exit(1);
}

console.log(
  `check-api-docs: ${checked} published exports, ${EXEMPT.size} exempt, every one documented and named in llms-full.txt, ${VISIBLE_BUT_NOT_EXPORTED.size} visible but not exported and known`,
);
