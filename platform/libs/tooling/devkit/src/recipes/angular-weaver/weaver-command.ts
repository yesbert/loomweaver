import type { ResolvedWeaver } from './recipe';

export function commandBlock(weaver: ResolvedWeaver): string {
  return [
    '    ctx.registerCommand({',
    `      id: '${weaver.id}.hello',`,
    `      title: '${weaver.id}.action',`,
    `      description: '${weaver.id}.actionDescription',`,
    '      arguments: [',
    `        { name: 'tone', kind: 'choice', choices: ['info', 'success', 'warning'], description: '${weaver.id}.actionTone' },`,
    '      ],',
    `      answers: '${weaver.id}.actionAnswers',`,
    `      shortcut: '${weaver.features.shortcut}',`,
    '      callable: true,',
    ...(weaver.features.agent
      ? [
          "      // What an agent's word is enough for. The platform states it and enforces nothing:",
          '      // the asking is the connection\'s half, which reads this off the call.',
          "      agentConsent: 'ask',",
        ]
      : []),
    '      run: (_context, args) => {',
    "        const tone = toneOf(args?.['tone']);",
    `        ctx.ui.toast({ message: '${weaver.id}.action', kind: tone });`,
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
