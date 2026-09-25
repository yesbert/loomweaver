import { FileMap } from '../../lib/generate/types';
import { RIGHT_PANEL_REGION } from '../shell-regions';
import type { ResolvedWeaver } from './recipe';
import { panelFile, panelTemplateFile } from './agent-panel';
import { standInFile } from './agent-stand-in';

/**
 * The protocol package, pinned to the range the adapter declares as a peer: two different ranges
 * resolve to two copies, and an event built by one is not the event the other switches on. The
 * adapter itself is published on the platform's own version line, so a generated weaver asks for
 * `PLATFORM_VERSION`. `check-agent-versions` fails the build when either drifts.
 */
export const AG_UI_PROTOCOL_VERSION = '0.0.x';

function connectionFile(weaver: ResolvedWeaver): string {
  return `import { signal } from '@angular/core';
import {
  commandTools,
  type CommandTools,
  type PendingToolCall,
  type ToolDecision,
} from '@loomweaver/ag-ui';
import type { PluginContext } from '@loomweaver/plugin-sdk';

// A factory, not a module-level connection: everything a run needs lives in the closure, so a second
// one never shares state with the first.
export function ${weaver.propertyName}Connection(ctx: PluginContext): CommandTools {
  return commandTools(ctx, { before: (call) => decide(ctx, call) });
}

// The one connection this plugin activates, published for its panel. Set in activate(), cleared in
// deactivate(), so the panel renders an honest empty state either side of that.
export const ${weaver.propertyName}Agent = signal<CommandTools | null>(null);

// What an agent's word is enough for is the command's own statement, declared where the command is
// registered and read off the call here. No list of ids lives beside the commands: a list drifts from
// what it describes, and it cannot speak for a command another plugin registered. Acting on the
// statement is this weaver's half: the workbench states it and enforces nothing.
async function decide(
  ctx: PluginContext,
  call: PendingToolCall,
): Promise<ToolDecision> {
  if (call.agentConsent === 'never') {
    return {
      decision: 'decline',
      reason: 'an agent may not run this one on its own word.',
    };
  }
  if (call.agentConsent !== 'ask' && call.agentConsent !== 'ask-always') {
    return { decision: 'run' };
  }
  const yes = await ctx.ui.confirm({
    title: '${weaver.id}.agent.confirm.title',
    message: '${weaver.id}.agent.confirm.message',
    confirmLabel: '${weaver.id}.agent.confirm.yes',
    cancelLabel: '${weaver.id}.agent.confirm.no',
    tone: 'warning',
  });
  // A decision can only narrow. Letting a call through does not make it reachable: the workbench
  // still refuses whatever it always refused.
  return yes
    ? { decision: 'run' }
    : { decision: 'decline', reason: 'the person at the keyboard said no.' };
}
`;
}

function specFile(weaver: ResolvedWeaver): string {
  return `import { EventType, type BaseEvent } from '@ag-ui/core';
import type { CommandArguments, PluginContext } from '@loomweaver/plugin-sdk';
import { ${weaver.propertyName}Connection } from './${weaver.id}-agent';

interface Asked {
  readonly id: string;
  readonly args?: CommandArguments;
}

function contextThat(confirms: boolean, ran: Asked[]): PluginContext {
  return {
    invocableCommands: () => [
      // agentConsent travels with the command, which is what the connection reads off the call.
      { id: '${weaver.id}.hello', title: '${weaver.name} action', description: 'Shows a short message.', agentConsent: 'ask' },
    ],
    invokeCommand: (id: string, args?: CommandArguments) => {
      ran.push({ id, args });
      return Promise.resolve({ outcome: 'answered', value: { tone: args?.['tone'] ?? 'info' } });
    },
    ui: { confirm: () => Promise.resolve(confirms) },
  } as unknown as PluginContext;
}

function event(type: EventType, fields: Record<string, unknown>): BaseEvent {
  return { type, ...fields } as unknown as BaseEvent;
}

describe('${weaver.propertyName}Connection', () => {
  it('offers what the workbench offers', () => {
    const tools = ${weaver.propertyName}Connection(contextThat(true, []));
    expect(tools.list().map((tool) => tool.name)).toEqual(['${weaver.id}.hello']);
  });

  it('assembles a call from its events and answers with the outcome', async () => {
    const ran: Asked[] = [];
    const tools = ${weaver.propertyName}Connection(contextThat(true, ran));

    expect(
      await tools.receive(
        event(EventType.TOOL_CALL_START, {
          toolCallId: 'c1',
          toolCallName: '${weaver.id}.hello',
        }),
      ),
    ).toBeNull();
    await tools.receive(
      event(EventType.TOOL_CALL_ARGS, { toolCallId: 'c1', delta: '{"tone"' }),
    );
    await tools.receive(
      event(EventType.TOOL_CALL_ARGS, { toolCallId: 'c1', delta: ':"success"}' }),
    );
    const answer = await tools.receive(
      event(EventType.TOOL_CALL_END, { toolCallId: 'c1' }),
    );

    expect(ran).toEqual([{ id: '${weaver.id}.hello', args: { tone: 'success' } }]);
    expect(JSON.parse(answer?.content ?? '{}').tone).toBe('success');
    expect(answer?.error).toBeUndefined();
  });

  it('never reaches the workbench when a consequential call is declined', async () => {
    const ran: Asked[] = [];
    const tools = ${weaver.propertyName}Connection(contextThat(false, ran));

    await tools.receive(
      event(EventType.TOOL_CALL_START, {
        toolCallId: 'c2',
        toolCallName: '${weaver.id}.hello',
      }),
    );
    await tools.receive(
      event(EventType.TOOL_CALL_ARGS, { toolCallId: 'c2', delta: '{}' }),
    );
    const answer = await tools.receive(
      event(EventType.TOOL_CALL_END, { toolCallId: 'c2' }),
    );

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
    [`src/lib/agent/${weaver.id}-agent.ts`]: connectionFile(weaver),
    [`src/lib/agent/${weaver.id}-agent-source.ts`]: standInFile(weaver),
    [`src/lib/agent/${weaver.id}-agent-panel.ts`]: panelFile(weaver),
    [`src/lib/agent/${weaver.id}-agent-panel.html`]: panelTemplateFile(weaver),
  };
  if (weaver.features.spec) {
    files[`src/lib/agent/${weaver.id}-agent.spec.ts`] = specFile(weaver);
  }
  return files;
}
