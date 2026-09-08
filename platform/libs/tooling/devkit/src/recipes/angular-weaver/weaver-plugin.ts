import type { ResolvedWeaver } from './recipe';
import { agentSurfaceBlock } from './agent-files';
import { CONTAINER_EXAMPLE_ID, capabilityItems } from './weaver-terms';
import { commandBlock, toneHelper } from './weaver-command';

const SURFACE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>';

function containerChildIds(w: ResolvedWeaver): readonly string[] {
  return [`${w.id}.canvas`, `${w.id}.details`];
}

function containerSurfaceBlock(w: ResolvedWeaver): string {
  const children = containerChildIds(w)
    .map((id) => `'${id}'`)
    .join(', ');
  const lines = [
    '    ctx.registerSurface({',
    `      id: '${w.id}',`,
    `      title: '${w.id}.title',`,
    `      icon: '${w.id}',`,
    `      routable: { path: '${w.id}/:id' },`,
    '      container: {',
    `        children: [${children}],`,
    `        initial: [${children}],`,
    '      },',
  ];
  if (w.features.access) lines.push(`      access: ${w.features.access},`);
  lines.push('    });');

  for (const [suffix, className] of [
    ['canvas', `${w.className}CanvasView`],
    ['details', `${w.className}DetailsView`],
  ]) {
    lines.push(
      '    ctx.registerSurface({',
      `      id: '${w.id}.${suffix}',`,
      `      title: '${w.id}.${suffix}',`,
      '      docks: [],',
      `      component: ${className},`,
      '    });',
    );
  }
  return lines.join('\n');
}

function surfaceBlock(w: ResolvedWeaver): string {
  if (w.features.container) {
    return containerSurfaceBlock(w);
  }
  const lines = [
    '    ctx.registerSurface({',
    `      id: '${w.id}',`,
    `      title: '${w.id}.title',`,
    `      icon: '${w.id}',`,
    `      component: ${w.className}View,`,
  ];
  if (w.features.instanceable) {
    lines.push("      docks: ['left-panel'],", '      instanceable: true,');
  } else {
    lines.push(`      routable: { path: '${w.id}' },`);
  }
  if (w.features.access) lines.push(`      access: ${w.features.access},`);
  lines.push('    });');
  return lines.join('\n');
}

function railTarget(w: ResolvedWeaver): string {
  if (w.features.container) {
    return `ctx.navigateContent('${w.id}/${CONTAINER_EXAMPLE_ID}')`;
  }
  if (w.features.instanceable) {
    return `ctx.revealSurface('${w.id}')`;
  }
  return `ctx.navigateContent('${w.id}')`;
}

function railBlock(w: ResolvedWeaver): string {
  const lines = [
    '    ctx.registerRailItem({',
    `      id: '${w.id}.rail',`,
    "      rail: 'primary',",
    `      icon: '${w.id}',`,
    `      title: '${w.id}.title',`,
    `      run: () => ${railTarget(w)},`,
  ];
  if (w.features.access) lines.push(`      access: ${w.features.access},`);
  lines.push('    });');
  return lines.join('\n');
}

function barItemBlock(w: ResolvedWeaver): string {
  return [
    '    ctx.registerBarItem({',
    `      id: '${w.id}.bar',`,
    "      bar: 'status-bar',",
    "      slot: 'end',",
    `      icon: '${w.id}',`,
    `      tooltip: '${w.id}.action',`,
    `      command: '${w.id}.hello',`,
    '    });',
  ].join('\n');
}

function aboutCommandBlock(w: ResolvedWeaver): string {
  return [
    '    ctx.registerCommand({',
    `      id: '${w.id}.about',`,
    `      title: '${w.id}.about',`,
    `      run: () => ctx.ui.open(${w.className}AboutDialog, { data: ctx.host, title: '${w.id}.title' }),`,
    '    });',
  ].join('\n');
}

function aboutRailBlock(w: ResolvedWeaver): string {
  return [
    '    ctx.registerRailItem({',
    `      id: '${w.id}.rail.about',`,
    "      rail: 'primary',",
    "      anchor: 'bottom',",
    `      icon: '${w.id}',`,
    `      title: '${w.id}.about',`,
    `      command: '${w.id}.about',`,
    '    });',
  ].join('\n');
}

function menuBlock(w: ResolvedWeaver): string {
  return [
    '    ctx.registerMenuItem({',
    `      menu: '${w.features.menuSlot}',`,
    `      command: '${w.id}.hello',`,
    '    });',
  ].join('\n');
}

function settingsBlock(w: ResolvedWeaver): string {
  return [
    '    ctx.registerSettingsSection({',
    `      id: '${w.id}',`,
    `      title: '${w.id}.settings.title',`,
    '      rows: [',
    '        {',
    "          id: 'enabled',",
    `          label: '${w.id}.settings.enabled',`,
    `          control: { kind: 'toggle', value: () => ${w.propertyName}Enabled(), set: (v) => ${w.propertyName}Enabled.set(v) },`,
    '        },',
    '        {',
    "          id: 'note',",
    `          label: '${w.id}.settings.note',`,
    `          control: { kind: 'text', value: () => ${w.propertyName}Note(), set: (v) => ${w.propertyName}Note.set(v) },`,
    '        },',
    '      ],',
    '    });',
  ].join('\n');
}

function pluginImports(w: ResolvedWeaver): readonly string[] {
  const imports = ["import { Plugin } from '@loomweaver/plugin-sdk';"];
  if (w.features.container) {
    imports.push(
      `import { ${w.className}CanvasView } from '../views/${w.id}-canvas-view';`,
      `import { ${w.className}DetailsView } from '../views/${w.id}-details-view';`,
    );
  } else {
    imports.push(`import { ${w.className}View } from '../views/${w.id}-view';`);
  }
  if (w.features.about) {
    imports.push(
      `import { ${w.className}AboutDialog } from '../dialogs/${w.id}-about-dialog';`,
    );
  }
  if (w.features.agent) {
    imports.push(
      `import { ${w.propertyName}Agent, ${w.propertyName}Connection } from '../agent/${w.id}-agent';`,
      `import { ${w.className}AgentPanel } from '../agent/${w.id}-agent-panel';`,
    );
  }
  if (w.features.settings) {
    imports.unshift("import { signal } from '@angular/core';");
  }
  return imports;
}

function pluginConsts(w: ResolvedWeaver): readonly string[] {
  const consts = [`const icon =\n  '${SURFACE_ICON}';`];
  if (w.features.settings) {
    consts.push(
      `const ${w.propertyName}Enabled = signal(true);`,
      `const ${w.propertyName}Note = signal('');`,
    );
  }
  if (w.features.command) consts.push(toneHelper());
  return consts;
}

function pluginBody(w: ResolvedWeaver): readonly string[] {
  const body = [`    ctx.contributeIcons({ '${w.id}': icon });`];
  if (w.features.agent) {
    body.push(
      `    ${w.propertyName}Agent.set(${w.propertyName}Connection(ctx));`,
    );
  }
  if (w.features.command) body.push(commandBlock(w));
  if (w.features.about) body.push(aboutCommandBlock(w));
  body.push(surfaceBlock(w), railBlock(w));
  if (w.features.about) body.push(aboutRailBlock(w));
  if (w.features.barItem) body.push(barItemBlock(w));
  if (w.features.menuSlot) body.push(menuBlock(w));
  if (w.features.settings) body.push(settingsBlock(w));
  if (w.features.agent) body.push(agentSurfaceBlock(w));
  return body;
}

export function pluginFile(w: ResolvedWeaver): string {
  const body = pluginBody(w);
  const deactivate = w.features.agent
    ? `\n  deactivate() {\n    ${w.propertyName}Agent.set(null);\n  },`
    : '';

  return `${pluginImports(w).join('\n')}

${pluginConsts(w).join('\n\n')}

export const ${w.propertyName}Plugin: Plugin = {
  manifest: {
    id: '${w.id}',
    name: '${w.name}',
    capabilities: [${capabilityItems(w.capabilities)}],
  },
  activate(ctx) {
${body.join('\n')}
  },${deactivate}
};
`;
}
