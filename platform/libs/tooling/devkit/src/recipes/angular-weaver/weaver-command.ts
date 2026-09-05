import type { ResolvedWeaver } from './recipe';

export function commandBlock(w: ResolvedWeaver): string {
  return [
    '    ctx.registerCommand({',
    `      id: '${w.id}.hello',`,
    `      title: '${w.id}.action',`,
    `      description: '${w.id}.actionDescription',`,
    '      arguments: [',
    `        { name: 'tone', kind: 'choice', choices: ['info', 'success', 'warning'], description: '${w.id}.actionTone' },`,
    '      ],',
    `      answers: '${w.id}.actionAnswers',`,
    `      shortcut: '${w.features.shortcut}',`,
    '      callable: true,',
    '      run: (_context, args) => {',
    "        const tone = toneOf(args?.['tone']);",
    `        ctx.ui.toast({ message: '${w.id}.action', kind: tone });`,
    '        return { tone };',
    '      },',
    '    });',
  ].join('\n');
}

export function toneHelper(): string {
  return [
    "type Tone = 'info' | 'success' | 'warning';",
    '',
    '// The workbench already refused anything outside the declared choices; this narrows the type.',
    'function toneOf(value: unknown): Tone {',
    "  return value === 'success' || value === 'warning' ? value : 'info';",
    '}',
  ].join('\n');
}
