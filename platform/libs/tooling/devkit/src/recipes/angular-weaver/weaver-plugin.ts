import type { ResolvedWeaver } from './weaver-input';
import { agentSurfaceBlock } from './agent-files';
import { quotedList } from '../../lib/amend/compose';
import {
  LEFT_PANEL_REGION,
  RAIL_REGION,
  STATUS_BAR_REGION,
} from '../shell-regions';
import { commandBlock, toneHelper } from './weaver-command';

export const CONTAINER_EXAMPLE_ID = 'example';

const SURFACE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>';

function containerChildIds(weaver: ResolvedWeaver): readonly string[] {
  return [`${weaver.id}.canvas`, `${weaver.id}.details`];
}

function containerSurfaceBlock(weaver: ResolvedWeaver): string {
  const children = containerChildIds(weaver)
    .map((id) => `'${id}'`)
    .join(', ');
  const lines = [
    '    ctx.registerSurface({',
    `      id: '${weaver.id}',`,
    `      title: '${weaver.id}.title',`,
    `      icon: '${weaver.id}',`,
    `      routable: { path: '${weaver.id}/:id' },`,
    '      container: {',
    `        children: [${children}],`,
    `        initial: [${children}],`,
    '      },',
    ...accessLine(weaver),
    '    });',
  ];

  for (const [suffix, className] of [
    ['canvas', `${weaver.className}CanvasView`],
    ['details', `${weaver.className}DetailsView`],
  ]) {
    lines.push(
      '    ctx.registerSurface({',
      `      id: '${weaver.id}.${suffix}',`,
      `      title: '${weaver.id}.${suffix}',`,
      '      docks: [],',
      `      component: ${className},`,
      '    });',
    );
  }
  return lines.join('\n');
}

function surfaceBlock(weaver: ResolvedWeaver): string {
  if (weaver.features.container) {
    return containerSurfaceBlock(weaver);
  }
  const lines = [
    '    ctx.registerSurface({',
    `      id: '${weaver.id}',`,
    `      title: '${weaver.id}.title',`,
    `      icon: '${weaver.id}',`,
    `      component: ${weaver.className}View,`,
  ];
  if (weaver.features.instanceable) {
    lines.push(`      docks: ['${LEFT_PANEL_REGION}'],`, '      instanceable: true,');
  } else {
    lines.push(`      routable: { path: '${weaver.id}' },`);
  }
  lines.push(...accessLine(weaver), '    });');
  return lines.join('\n');
}

function railTarget(weaver: ResolvedWeaver): string {
  if (weaver.features.container) {
    return `ctx.navigateContent('${weaver.id}/${CONTAINER_EXAMPLE_ID}')`;
  }
  if (weaver.features.instanceable) {
    return `ctx.revealSurface('${weaver.id}')`;
  }
  return `ctx.navigateContent('${weaver.id}')`;
}

function railBlock(weaver: ResolvedWeaver): string {
  const lines = [
    '    ctx.registerRailItem({',
    `      id: '${weaver.id}.rail',`,
    `      rail: '${RAIL_REGION}',`,
    `      icon: '${weaver.id}',`,
    `      title: '${weaver.id}.title',`,
    `      run: () => ${railTarget(weaver)},`,
    ...accessLine(weaver),
    '    });',
  ];
  return lines.join('\n');
}

function barItemBlock(weaver: ResolvedWeaver): string {
  return [
    '    ctx.registerBarItem({',
    `      id: '${weaver.id}.bar',`,
    `      bar: '${STATUS_BAR_REGION}',`,
    "      slot: 'end',",
    `      icon: '${weaver.id}',`,
    `      tooltip: '${weaver.id}.action',`,
    `      command: '${weaver.id}.hello',`,
    '    });',
  ].join('\n');
}

function aboutCommandBlock(weaver: ResolvedWeaver): string {
  return [
    '    ctx.registerCommand({',
    `      id: '${weaver.id}.about',`,
    `      title: '${weaver.id}.about',`,
    `      run: () => ctx.ui.open(${weaver.className}AboutDialog, { data: ctx.host, title: '${weaver.id}.title' }),`,
    '    });',
  ].join('\n');
}

function aboutRailBlock(weaver: ResolvedWeaver): string {
  return [
    '    ctx.registerRailItem({',
    `      id: '${weaver.id}.rail.about',`,
    `      rail: '${RAIL_REGION}',`,
    "      anchor: 'bottom',",
    `      icon: '${weaver.id}',`,
    `      title: '${weaver.id}.about',`,
    `      command: '${weaver.id}.about',`,
    '    });',
  ].join('\n');
}

function menuBlock(weaver: ResolvedWeaver): string {
  return [
    '    ctx.registerMenuItem({',
    `      menu: '${weaver.features.menuSlot}',`,
    `      command: '${weaver.id}.hello',`,
    '    });',
  ].join('\n');
}

function settingsBlock(weaver: ResolvedWeaver): string {
  return [
    '    ctx.registerSettingsSection({',
    `      id: '${weaver.id}',`,
    `      title: '${weaver.id}.settings.title',`,
    '      rows: [',
    '        {',
    "          id: 'enabled',",
    `          label: '${weaver.id}.settings.enabled',`,
    `          control: { kind: 'toggle', value: () => ${weaver.propertyName}Enabled(), set: (v) => ${weaver.propertyName}Enabled.set(v) },`,
    '        },',
    '        {',
    "          id: 'note',",
    `          label: '${weaver.id}.settings.note',`,
    `          control: { kind: 'text', value: () => ${weaver.propertyName}Note(), set: (v) => ${weaver.propertyName}Note.set(v) },`,
    '        },',
    '      ],',
    '    });',
  ].join('\n');
}

function pluginImports(weaver: ResolvedWeaver): readonly string[] {
  const imports = ["import { Plugin } from '@loomweaver/plugin-sdk';"];
  if (weaver.features.container) {
    imports.push(
      `import { ${weaver.className}CanvasView } from '../views/${weaver.id}-canvas-view';`,
      `import { ${weaver.className}DetailsView } from '../views/${weaver.id}-details-view';`,
    );
  } else {
    imports.push(`import { ${weaver.className}View } from '../views/${weaver.id}-view';`);
  }
  if (weaver.features.about) {
    imports.push(
      `import { ${weaver.className}AboutDialog } from '../dialogs/${weaver.id}-about-dialog';`,
    );
  }
  if (weaver.features.agent) {
    imports.push(
      `import { ${weaver.propertyName}Agent, ${weaver.propertyName}Connection } from '../agent/${weaver.id}-agent';`,
      `import { ${weaver.className}AgentPanel } from '../agent/${weaver.id}-agent-panel';`,
    );
  }
  if (weaver.features.settings) {
    imports.unshift("import { signal } from '@angular/core';");
  }
  return imports;
}

function pluginConsts(weaver: ResolvedWeaver): readonly string[] {
  const consts = [`const icon =\n  '${SURFACE_ICON}';`];
  if (weaver.features.settings) {
    consts.push(
      `const ${weaver.propertyName}Enabled = signal(true);`,
      `const ${weaver.propertyName}Note = signal('');`,
    );
  }
  if (weaver.features.command) consts.push(toneHelper());
  return consts;
}

function pluginBody(weaver: ResolvedWeaver): readonly string[] {
  const body = [`    ctx.contributeIcons({ '${weaver.id}': icon });`];
  if (weaver.features.agent) {
    body.push(
      `    ${weaver.propertyName}Agent.set(${weaver.propertyName}Connection(ctx));`,
    );
  }
  if (weaver.features.command) body.push(commandBlock(weaver));
  if (weaver.features.about) body.push(aboutCommandBlock(weaver));
  body.push(surfaceBlock(weaver), railBlock(weaver));
  if (weaver.features.about) body.push(aboutRailBlock(weaver));
  if (weaver.features.barItem) body.push(barItemBlock(weaver));
  if (weaver.features.menuSlot) body.push(menuBlock(weaver));
  if (weaver.features.settings) body.push(settingsBlock(weaver));
  if (weaver.features.agent) body.push(agentSurfaceBlock(weaver));
  return body;
}

export function pluginFile(weaver: ResolvedWeaver): string {
  const body = pluginBody(weaver);
  const deactivate = weaver.features.agent
    ? `\n  deactivate() {\n    ${weaver.propertyName}Agent.set(null);\n  },`
    : '';

  return `${pluginImports(weaver).join('\n')}

${pluginConsts(weaver).join('\n\n')}

export const ${weaver.propertyName}Plugin: Plugin = {
  manifest: {
    id: '${weaver.id}',
    name: '${weaver.name}',
    capabilities: [${quotedList(weaver.capabilities)}],
  },
  activate(ctx) {
${body.join('\n')}
  },${deactivate}
};
`;
}

function accessLine(weaver: ResolvedWeaver): string[] {
  return weaver.features.access
    ? [`      access: ${weaver.features.access},`]
    : [];
}
