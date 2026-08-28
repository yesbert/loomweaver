#!/usr/bin/env node
// Fails when a published export is not mentioned anywhere in the public documentation.
//
// "Feature complete" is a claim that rots silently: a new export lands, the guide that would have
// explained it is never touched, and nothing notices. This reads the PACKED type declarations —
// the actual contract consumers see, not the source barrels, which export more than they publish —
// and requires every exported name to appear in docs/ or the llms files.
//
// Run it after `nx package plugin-sdk && nx package shell`.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

const ENTRIES = {
  '@loomweaver/plugin-sdk': 'platform/dist/libs/core/plugin-sdk/src/index.d.ts',
  '@loomweaver/shell': 'platform/dist/libs/core/shell/types/loomweaver-shell.d.ts',
  '@loomweaver/ag-ui': 'platform/dist/libs/integrations/ag-ui/src/index.d.ts',
  // Deliberately a global script rather than a module: @loomweaver/frame-kit is loaded by a script tag
  // and installs itself, so what it publishes are ambient names, not exports.
  '@loomweaver/frame-kit': 'platform/libs/core/frame-kit/dist/lw-frame.d.ts',
};

// Names that carry no prose of their own, with the reason each is exempt. Anything not listed here
// must be documented — adding a name to this list is a deliberate act, visible in review.
const EXEMPT = new Map([
  // Custom-element plumbing: the documented contract is the tag and its CSS classes, not the
  // registration helper or the class behind it (see reference/design-tokens.md).
  ['LW_BUTTON_TAG', 'element tag constant'],
  ['LW_ICON_TAG', 'element tag constant'],
  ['LW_MARKDOWN_TAG', 'element tag constant'],
  ['LW_TOOLTIP_TAG', 'element tag constant'],
  ['defineLwButton', 'element registration helper'],
  ['defineLwIcon', 'element registration helper'],
  ['defineLwMarkdown', 'element registration helper'],
  ['defineLwTooltip', 'element registration helper'],
  ['LwButtonElement', 'class behind <lw-button>'],
  ['LwIconElement', 'class behind <lw-icon>'],
  ['LwMarkdownElement', 'class behind <lw-markdown>'],
  ['LwTooltipElement', 'class behind <lw-tooltip>'],
  ['LwButton', 'Angular directive behind the .lw-btn class contract'],
  ['LwSpinner', 'component behind the documented spinner'],
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
  ['DialogOutlet', 'rendered by Shell; documented in host-services.md'],
  ['ToastOutlet', 'rendered by Shell; documented in host-services.md'],
  ['UpdateBadge', 'chrome component composed by id'],
]);

function docsBlob() {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry !== 'decisions') walk(full);
      } else if (entry.endsWith('.md')) {
        files.push(full);
      }
    }
  };
  walk(path.join(repoRoot, 'docs'));
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
      .sort();
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
  return names.sort();
}

const blob = docsBlob();
const missing = [];
const allExported = new Set();
let checked = 0;

for (const [pkg, relative] of Object.entries(ENTRIES)) {
  const entry = path.join(repoRoot, relative);
  if (!existsSync(entry)) {
    console.error(
      `check-api-docs: ${relative} is missing — run \`nx package plugin-sdk && nx package shell\` first.`,
    );
    process.exit(2);
  }
  for (const name of exportedNames(entry)) {
    checked++;
    allExported.add(name);
    if (EXEMPT.has(name)) continue;
    if (new RegExp(`\\b${name}\\b`).test(blob)) continue;
    missing.push(`${pkg} · ${name}`);
  }
}

// An exemption for a symbol that no longer ships is invisible drift: it reads like a decision but
// governs nothing, and the next reader takes it for the current contract.
const stale = [...EXEMPT.keys()].filter((name) => !allExported.has(name));
if (stale.length > 0) {
  console.error(
    `check-api-docs: ${stale.length} exemption(s) name a symbol that is no longer published:\n` +
      stale.map((name) => `  - ${name}`).join('\n') +
      '\n\nRemove them from EXEMPT in tools/check-api-docs.mjs.',
  );
  process.exit(1);
}

if (missing.length > 0) {
  console.error(
    `check-api-docs: ${missing.length} published export(s) appear nowhere in the documentation:\n` +
      missing.map((m) => `  - ${m}`).join('\n') +
      '\n\nDocument them, or add them to EXEMPT in tools/check-api-docs.mjs with a reason.',
  );
  process.exit(1);
}

console.log(
  `check-api-docs: ${checked} published exports, ${EXEMPT.size} exempt, 0 undocumented`,
);
