import type { ResolvedWeaver } from './weaver-input';

export function aboutDialogFile(weaver: ResolvedWeaver): string {
  return `import { Component, inject } from '@angular/core';
import { DialogRef, PluginHost } from '@loomweaver/plugin-sdk';

@Component({
  selector: '${weaver.prefix}-${weaver.id}-about-dialog',
  templateUrl: './${weaver.id}-about-dialog.html',
})
export class ${weaver.className}AboutDialog {
  protected readonly host = inject(DialogRef).data as PluginHost;
}
`;
}

export function aboutDialogTemplateFile(weaver: ResolvedWeaver): string {
  return `<div class="flex flex-col items-center gap-2 text-center">
  <h2 class="text-lg font-semibold text-content">${weaver.name}</h2>
  <span class="text-xs text-content-faint tabular-nums">v{{ host.version() }}</span>
</div>
`;
}

export function viewFile(weaver: ResolvedWeaver): string {
  if (!weaver.features.instanceable) {
    return `import { Component } from '@angular/core';

@Component({
  selector: '${weaver.prefix}-${weaver.id}-view',
  templateUrl: './${weaver.id}-view.html',
})
export class ${weaver.className}View {}
`;
  }
  return `import { Component, computed, inject } from '@angular/core';
import { VIEW_STATE, type ViewState } from '@loomweaver/plugin-sdk';

interface ${weaver.className}State {
  readonly sort: 'natural' | 'alpha';
}

const FRESH: ${weaver.className}State = { sort: 'natural' };

@Component({
  selector: '${weaver.prefix}-${weaver.id}-view',
  templateUrl: './${weaver.id}-view.html',
})
export class ${weaver.className}View {
  private readonly viewState = inject(VIEW_STATE) as ViewState<${weaver.className}State>;

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

export function viewTemplateFile(weaver: ResolvedWeaver): string {
  const stateNote = weaver.features.instanceable
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
  <h2 class="text-lg font-semibold text-content">${weaver.name}</h2>
  <p class="text-sm text-content-faint">
    Your new weaver surface. Register more surfaces, commands, rail items and menus on
    <code class="text-content">ctx</code> inside the plugin's
    <code class="text-content">activate</code>.
  </p>
${stateNote}</div>
`;
}

export function childViewFile(
  weaver: ResolvedWeaver,
  suffix: string,
  className: string,
): string {
  return `import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: '${weaver.prefix}-${weaver.id}-${suffix}-view',
  templateUrl: './${weaver.id}-${suffix}-view.html',
})
export class ${className} {
  private readonly route = inject(ActivatedRoute, { optional: true });

  protected readonly instanceId =
    this.route?.snapshot.paramMap.get('id') ?? '—';
}
`;
}

export function childViewTemplateFile(weaver: ResolvedWeaver, heading: string): string {
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

export function specFile(weaver: ResolvedWeaver): string {
  return `import { ${weaver.propertyName}Plugin } from './${weaver.id}.plugin';

describe('${weaver.propertyName}Plugin', () => {
  it('declares its manifest', () => {
    expect(${weaver.propertyName}Plugin.manifest.id).toBe('${weaver.id}');
    expect(${weaver.propertyName}Plugin.manifest.capabilities).toContain('contributions');
  });
});
`;
}
