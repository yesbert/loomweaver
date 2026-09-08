import { FileMap, Recipe } from '../../lib/generate/types';
import {
  isKebabId,
  toCamelCase,
  toPascalCase,
  toTitleCase,
} from '../../lib/generate/casing';
import { KNOWN_CAPABILITIES } from '../../lib/validate/manifest';
import { agentFiles } from './agent-files';
import { readmeFile } from './weaver-readme';
import { i18nFile } from './weaver-i18n';
import { pluginFile } from './weaver-plugin';

export interface WeaverFeatures {
  readonly command?: boolean;
  readonly menu?: string | boolean;
  readonly settings?: boolean;
  readonly access?: string;
  readonly shortcut?: string;
  readonly barItem?: boolean;
  readonly about?: boolean;
  readonly instanceable?: boolean;
  readonly container?: boolean;
  readonly agent?: boolean;
  readonly spec?: boolean;
}

export interface WeaverInput {
  readonly id: string;
  readonly name?: string;
  readonly capabilities?: readonly string[];
  readonly features?: WeaverFeatures;
  /** Selector prefix for the generated components. Defaults to 'lw'. */
  readonly prefix?: string;
  /** The alias the consuming workspace imports the library under. Defaults to '@loomweaver/<id>-weaver'. */
  readonly importPath?: string;
}

interface ResolvedFeatures {
  readonly command: boolean;
  readonly menuSlot?: string;
  readonly settings: boolean;
  readonly access?: string;
  readonly shortcut: string;
  readonly barItem: boolean;
  readonly about: boolean;
  readonly instanceable: boolean;
  readonly container: boolean;
  readonly agent: boolean;
  readonly spec: boolean;
}

export interface ResolvedWeaver {
  readonly id: string;
  readonly name: string;
  readonly className: string;
  readonly propertyName: string;
  readonly capabilities: readonly string[];
  readonly features: ResolvedFeatures;
  readonly prefix: string;
  readonly importPath: string;
}

const DEFAULT_MENU_SLOT = 'content/tab/context';

function accessLiteral(spec: string): string {
  if (spec === 'authenticated') return '{ authenticated: true }';
  if (spec === 'anonymous') return '{ authenticated: false }';
  if (spec.startsWith('role:')) {
    const role = spec.slice('role:'.length);
    if (!role)
      throw new Error('Access "role:" needs a role name, e.g. "role:admin".');
    if (/['\\]/.test(role))
      throw new Error(
        `Access role "${role}" must not contain quotes or backslashes.`,
      );
    return `{ anyRole: ['${role}'] }`;
  }
  throw new Error(
    `Unknown access "${spec}". Use "authenticated", "anonymous" or "role:<name>".`,
  );
}

function resolveMenuSlot(menu: WeaverFeatures['menu']): string | undefined {
  if (menu === true) {
    return DEFAULT_MENU_SLOT;
  }
  return typeof menu === 'string' && menu.length ? menu : undefined;
}

const PLATFORM_BOUND_CHORD_TOKENS = new Set([
  'cmd',
  'command',
  'ctrl',
  'control',
  'meta',
]);

function assertPlatformNeutralChord(shortcut: string): void {
  const tokens = shortcut
    .toLowerCase()
    .split('+')
    .map((token) => token.trim());
  const bound = tokens.find((token) => PLATFORM_BOUND_CHORD_TOKENS.has(token));
  if (bound) {
    throw new Error(
      `Shortcut "${shortcut}" binds the platform-specific "${bound}" key. Use the neutral 'mod' token (e.g. 'mod+shift+k') — the host renders it as ⌘ on macOS and Ctrl elsewhere.`,
    );
  }
}

function resolveFeatures(
  id: string,
  input: WeaverFeatures | undefined,
): ResolvedFeatures {
  const menuSlot = resolveMenuSlot(input?.menu);
  const barItem = Boolean(input?.barItem);
  const hasShortcut = Boolean(input?.shortcut?.trim());
  if (hasShortcut) {
    assertPlatformNeutralChord(input?.shortcut?.trim() ?? '');
  }
  const instanceable = Boolean(input?.instanceable);
  const container = Boolean(input?.container);
  if (instanceable && container) {
    throw new Error(
      'A surface cannot be both a container and instanceable: a container tab holds its own ":id" and is therefore routable, while named instances exist only for a docked, non-routable surface. Pick one.',
    );
  }
  const agent = Boolean(input?.agent);
  return {
    command:
      Boolean(input?.command) ||
      menuSlot !== undefined ||
      barItem ||
      hasShortcut ||
      agent,
    menuSlot,
    settings: Boolean(input?.settings),
    access: input?.access ? accessLiteral(input.access) : undefined,
    shortcut: input?.shortcut?.trim() || `mod+shift+${id.charAt(0)}`,
    barItem,
    about: Boolean(input?.about),
    instanceable,
    container,
    agent,
    spec: input?.spec !== false,
  };
}

function deriveCapabilities(features: ResolvedFeatures): string[] {
  const set = new Set(['contributions', 'navigation']);
  if (features.command) set.add('ui');
  if (features.about) {
    set.add('ui');
    set.add('host');
  }
  if (features.agent) {
    set.add('ui');
    set.add('automation');
  }
  return KNOWN_CAPABILITIES.filter((capability) => set.has(capability));
}

export function resolveWeaverInput(input: WeaverInput): ResolvedWeaver {
  if (!isKebabId(input.id)) {
    throw new Error(
      `Weaver id must be kebab-case (e.g. "notes"); got "${input.id}".`,
    );
  }
  const features = resolveFeatures(input.id, input.features);
  const capabilities = input.capabilities?.length
    ? [...input.capabilities]
    : deriveCapabilities(features);
  return {
    id: input.id,
    name: input.name?.trim() || toTitleCase(input.id),
    className: toPascalCase(input.id),
    propertyName: toCamelCase(input.id),
    capabilities,
    features,
    prefix: input.prefix?.trim() || 'lw',
    importPath: input.importPath?.trim() || `@loomweaver/${input.id}-weaver`,
  };
}

function aboutDialogFile(w: ResolvedWeaver): string {
  return `import { Component, inject } from '@angular/core';
import { DialogRef, PluginHost } from '@loomweaver/plugin-sdk';

@Component({
  selector: '${w.prefix}-${w.id}-about-dialog',
  templateUrl: './${w.id}-about-dialog.html',
})
export class ${w.className}AboutDialog {
  protected readonly host = inject(DialogRef).data as PluginHost;
}
`;
}

function aboutDialogTemplateFile(w: ResolvedWeaver): string {
  return `<div class="flex flex-col items-center gap-2 text-center">
  <h2 class="text-lg font-semibold text-content">${w.name}</h2>
  <span class="text-xs text-content-faint tabular-nums">v{{ host.version() }}</span>
</div>
`;
}

function indexFile(w: ResolvedWeaver): string {
  return `export { ${w.propertyName}Plugin } from './lib/plugin/${w.id}.plugin';\n`;
}

function viewFile(w: ResolvedWeaver): string {
  if (!w.features.instanceable) {
    return `import { Component } from '@angular/core';

@Component({
  selector: '${w.prefix}-${w.id}-view',
  templateUrl: './${w.id}-view.html',
})
export class ${w.className}View {}
`;
  }
  return `import { Component, computed, inject } from '@angular/core';
import { VIEW_STATE, type ViewState } from '@loomweaver/plugin-sdk';

interface ${w.className}State {
  readonly sort: 'natural' | 'alpha';
}

const FRESH: ${w.className}State = { sort: 'natural' };

@Component({
  selector: '${w.prefix}-${w.id}-view',
  templateUrl: './${w.id}-view.html',
})
export class ${w.className}View {
  private readonly viewState = inject(VIEW_STATE) as ViewState<${w.className}State>;

  // undefined = a fresh instance, so apply your own default.
  private readonly state = computed(() => this.viewState.value() ?? FRESH);

  protected readonly sort = computed(() => this.state().sort);

  protected toggleSort(): void {
    // set() replaces the whole blob, so spread what is already there.
    this.viewState.set({
      ...this.state(),
      sort: this.sort() === 'alpha' ? 'natural' : 'alpha',
    });
  }
}
`;
}

function viewTemplateFile(w: ResolvedWeaver): string {
  const stateNote = w.features.instanceable
    ? `  <button type="button" class="lw-btn lw-btn--default self-start" (click)="toggleSort()">
    Sort: {{ sort() }}
  </button>
  <p class="text-sm text-content-faint">
    That choice lives in this instance's <code class="text-content">VIEW_STATE</code>, so it survives a
    tab switch, a collapsed sidebar and a reload. Anything that must not be lost belongs there.
  </p>
`
    : '';
  return `<div class="mx-auto flex max-w-2xl flex-col gap-4 p-6">
  <h2 class="text-lg font-semibold text-content">${w.name}</h2>
  <p class="text-sm text-content-faint">
    Your new weaver surface. Register more surfaces, commands, rail items and menus on
    <code class="text-content">ctx</code> inside the plugin's
    <code class="text-content">activate</code>.
  </p>
${stateNote}</div>
`;
}

function childViewFile(
  w: ResolvedWeaver,
  suffix: string,
  className: string,
): string {
  return `import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: '${w.prefix}-${w.id}-${suffix}-view',
  templateUrl: './${w.id}-${suffix}-view.html',
})
export class ${className} {
  private readonly route = inject(ActivatedRoute, { optional: true });

  protected readonly instanceId =
    this.route?.snapshot.paramMap.get('id') ?? '—';
}
`;
}

function childViewTemplateFile(w: ResolvedWeaver, heading: string): string {
  return `<div class="flex h-full flex-col gap-3 p-4">
  <h3 class="text-sm font-semibold text-content">${heading}</h3>
  <p class="text-sm text-content-faint">
    Scoped to <code class="text-content">{{ instanceId }}</code> — the id of the container tab this
    pane lives in. Every open container tab has its own inner tree, so two of them show two
    different ids side by side.
  </p>
</div>
`;
}

function specFile(w: ResolvedWeaver): string {
  return `import { ${w.propertyName}Plugin } from './${w.id}.plugin';

describe('${w.propertyName}Plugin', () => {
  it('declares its manifest', () => {
    expect(${w.propertyName}Plugin.manifest.id).toBe('${w.id}');
    expect(${w.propertyName}Plugin.manifest.capabilities).toContain('contributions');
  });
});
`;
}

export const angularWeaver: Recipe<WeaverInput> = {
  id: 'angular-weaver',
  build(input: WeaverInput): FileMap {
    const w = resolveWeaverInput(input);
    const files: Record<string, string> = {
      'src/index.ts': indexFile(w),
      [`src/lib/plugin/${w.id}.plugin.ts`]: pluginFile(w),
      'src/lib/i18n/en.json': i18nFile(w),
      'src/lib/i18n/de.json': i18nFile(w),
      'README.md': readmeFile(w),
    };
    if (w.features.container) {
      files[`src/lib/views/${w.id}-canvas-view.ts`] = childViewFile(
        w,
        'canvas',
        `${w.className}CanvasView`,
      );
      files[`src/lib/views/${w.id}-canvas-view.html`] = childViewTemplateFile(
        w,
        'Canvas',
      );
      files[`src/lib/views/${w.id}-details-view.ts`] = childViewFile(
        w,
        'details',
        `${w.className}DetailsView`,
      );
      files[`src/lib/views/${w.id}-details-view.html`] = childViewTemplateFile(
        w,
        'Details',
      );
    } else {
      files[`src/lib/views/${w.id}-view.ts`] = viewFile(w);
      files[`src/lib/views/${w.id}-view.html`] = viewTemplateFile(w);
    }
    if (w.features.about) {
      files[`src/lib/dialogs/${w.id}-about-dialog.ts`] = aboutDialogFile(w);
      files[`src/lib/dialogs/${w.id}-about-dialog.html`] =
        aboutDialogTemplateFile(w);
    }
    if (w.features.agent) {
      Object.assign(files, agentFiles(w));
    }
    if (w.features.spec) {
      files[`src/lib/plugin/${w.id}.plugin.spec.ts`] = specFile(w);
    }
    return files;
  },
};
