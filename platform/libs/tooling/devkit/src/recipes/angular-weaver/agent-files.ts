import { FileMap } from '../../lib/generate/types';
import { RIGHT_PANEL_REGION } from '../shell-regions';
import type { ResolvedWeaver } from './weaver-input';
import { panelFile, panelTemplateFile } from './agent-panel';
import { standInFile } from './agent-stand-in';
import { stringLiteral } from '../../lib/generate/escape';

/**
 * The protocol package, pinned to the range the adapter declares as a peer: two different ranges
 * resolve to two copies, and an event built by one is not the event the other switches on. The
 * adapter itself is published on the platform's own version line, so a generated weaver asks for
 * `PLATFORM_VERSION`. `check-agent-versions` fails the build when either drifts.
 */
export const AG_UI_PROTOCOL_VERSION = '0.0.x';

function connectionFile(weaver: ResolvedWeaver): string {
  return `import { signal } from '@angular/core';
import { commandTools, consentPolicy, type CommandTools } from '@loomweaver/ag-ui';
import type { PluginContext } from '@loomweaver/plugin-sdk';

// The connection is the workbench's half: the commands offered as tools, and each call put to the
// workbench and answered. The agent is yours and lives beside it, in ${weaver.id}-agent.ts.
//
// A factory, not a module-level connection: everything a run needs lives in the closure, so a second
// one never shares state with the first.
export function connect${weaver.className}(ctx: PluginContext): CommandTools {
  // What an agent's word is enough for is each command's own statement, declared where the command
  // is registered. consentPolicy acts on it: it declines what may never run on an agent's word, runs
  // what may, and asks through your confirmation for the rest, remembering a yes for a command that
  // asks first for as long as this connection lives. The workbench states and enforces nothing here,
  // so replace it with a decision of your own where you need one. A decision can only narrow: the
  // workbench still refuses whatever it always refused.
  return commandTools(ctx, {
    before: consentPolicy(() =>
      ctx.ui.confirm({
        title: '${weaver.id}.agent.confirm.title',
        message: '${weaver.id}.agent.confirm.message',
        confirmLabel: '${weaver.id}.agent.confirm.yes',
        cancelLabel: '${weaver.id}.agent.confirm.no',
        tone: 'warning',
      }),
    ),
  });
}

// The one connection this plugin activates, published for its panel. Set in activate(), cleared in
// deactivate(), so the panel renders an honest empty state either side of that.
export const ${weaver.propertyName}Tools = signal<CommandTools | null>(null);
`;
}

function specFile(weaver: ResolvedWeaver): string {
  return `import { EventType, type AGUIEvent, type ToolMessage } from '@ag-ui/core';
import type { CommandTools } from '@loomweaver/ag-ui';
import type { CommandArguments, PluginContext } from '@loomweaver/plugin-sdk';
import { connect${weaver.className} } from './${weaver.id}-connection';

interface Asked {
  readonly id: string;
  readonly args?: CommandArguments;
}

function contextThat(confirms: boolean, ran: Asked[], asked: string[] = []): PluginContext {
  return {
    invocableCommands: () => [
      // agentConsent travels with the command, which is what the connection reads off the call.
      { id: '${weaver.id}.hello', title: ${stringLiteral(`${weaver.name} action`)}, description: 'Shows a short message.', agentConsent: 'ask' },
    ],
    invokeCommand: (id: string, args?: CommandArguments) => {
      ran.push({ id, args });
      return Promise.resolve({ outcome: 'answered', value: { tone: args?.['tone'] ?? 'info' } });
    },
    ui: {
      confirm: (input: { title: string }) => {
        asked.push(input.title);
        return Promise.resolve(confirms);
      },
    },
  } as unknown as PluginContext;
}

function streamedCall(toolCallId: string, ...deltas: string[]): AGUIEvent[] {
  return [
    { type: EventType.TOOL_CALL_START, toolCallId, toolCallName: '${weaver.id}.hello' },
    ...deltas.map((delta): AGUIEvent => ({ type: EventType.TOOL_CALL_ARGS, toolCallId, delta })),
    { type: EventType.TOOL_CALL_END, toolCallId },
  ];
}

async function answersTo(tools: CommandTools, events: AGUIEvent[]): Promise<ToolMessage[]> {
  const answers: ToolMessage[] = [];
  for (const event of events) {
    const answer = await tools.receive(event);
    if (answer) {
      answers.push(answer);
    }
  }
  return answers;
}

describe('connect${weaver.className}', () => {
  it('offers what the workbench offers', () => {
    const tools = connect${weaver.className}(contextThat(true, []));
    expect(tools.list().map((tool) => tool.name)).toEqual(['${weaver.id}.hello']);
  });

  it('assembles a call from its events and answers with the outcome', async () => {
    const ran: Asked[] = [];
    const tools = connect${weaver.className}(contextThat(true, ran));

    const [answer] = await answersTo(tools, streamedCall('c1', '{"tone"', ':"success"}'));

    expect(ran).toEqual([{ id: '${weaver.id}.hello', args: { tone: 'success' } }]);
    expect(JSON.parse(answer?.content ?? '{}').tone).toBe('success');
    expect(answer?.error).toBeUndefined();
  });

  it('asks once for a command that asks first, and remembers the yes', async () => {
    const asked: string[] = [];
    const ran: Asked[] = [];
    const tools = connect${weaver.className}(contextThat(true, ran, asked));

    await answersTo(tools, streamedCall('c3', '{}'));
    await answersTo(tools, streamedCall('c4', '{}'));

    expect(asked).toEqual(['${weaver.id}.agent.confirm.title']);
    expect(ran).toHaveLength(2);
  });

  it('never reaches the workbench when a consequential call is declined', async () => {
    const ran: Asked[] = [];
    const tools = connect${weaver.className}(contextThat(false, ran));

    const [answer] = await answersTo(tools, streamedCall('c2', '{}'));

    expect(ran).toEqual([]);
    expect(answer?.error).toContain('did not run');
  });
});
`;
}

export function agentSurfaceBlock(weaver: ResolvedWeaver): string {
  return [
    '    ctx.registerSurface({',
    `      id: '${weaver.id}.agent',`,
    `      title: '${weaver.id}.agent.title',`,
    `      icon: '${weaver.id}',`,
    `      docks: ['${RIGHT_PANEL_REGION}'],`,
    '      padded: true,',
    `      component: ${weaver.className}AgentPanel,`,
    '    });',
  ].join('\n');
}

export function agentFiles(weaver: ResolvedWeaver): FileMap {
  const files: Record<string, string> = {
    [`src/lib/agent/${weaver.id}-connection.ts`]: connectionFile(weaver),
    [`src/lib/agent/${weaver.id}-agent.ts`]: standInFile(weaver),
    [`src/lib/agent/${weaver.id}-agent-panel.ts`]: panelFile(weaver),
    [`src/lib/agent/${weaver.id}-agent-panel.html`]: panelTemplateFile(weaver),
  };
  if (weaver.features.spec) {
    files[`src/lib/agent/${weaver.id}-connection.spec.ts`] = specFile(weaver);
  }
  return files;
}
