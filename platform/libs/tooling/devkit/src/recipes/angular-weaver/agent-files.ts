import { FileMap } from '../../lib/generate/types';
import type { ResolvedWeaver } from './recipe';
import { panelFile, panelTemplateFile } from './agent-panel';
import { standInFile } from './agent-stand-in';

/**
 * The adapter is published on the platform's own version line, so a generated weaver asks for the
 * version of the generator that wrote it. The protocol package is pinned to the range the adapter
 * declares as a peer: two different ranges resolve to two copies, and an event built by one is not
 * the event the other switches on. `check-agent-versions` fails the build when either drifts.
 */
export const AG_UI_ADAPTER_VERSION = '0.8.1';
export const AG_UI_PROTOCOL_VERSION = '0.0.x';

function connectionFile(w: ResolvedWeaver): string {
  return `import { signal } from '@angular/core';
import {
  commandTools,
  type CommandTools,
  type PendingToolCall,
  type ToolDecision,
} from '@loomweaver/ag-ui';
import type { PluginContext } from '@loomweaver/plugin-sdk';

// Commands an agent may not run on its own word. Each one asks the person at the keyboard first, and
// declining stops it: the workbench never sees the call. This weaver's own command is listed as an
// example — replace it with the ones that actually cost something.
const CONSEQUENTIAL = new Set(['${w.id}.hello']);

// A factory, not a module-level connection: everything a run needs lives in the closure, so a second
// one never shares state with the first.
export function ${w.propertyName}Connection(ctx: PluginContext): CommandTools {
  return commandTools(ctx, { before: (call) => decide(ctx, call) });
}

// The one connection this plugin activates, published for its panel. Set in activate(), cleared in
// deactivate(), so the panel renders an honest empty state either side of that.
export const ${w.propertyName}Agent = signal<CommandTools | null>(null);

async function decide(
  ctx: PluginContext,
  call: PendingToolCall,
): Promise<ToolDecision> {
  if (!CONSEQUENTIAL.has(call.commandId)) {
    return { decision: 'run' };
  }
  const yes = await ctx.ui.confirm({
    title: '${w.id}.agent.confirm.title',
    message: '${w.id}.agent.confirm.message',
    confirmLabel: '${w.id}.agent.confirm.yes',
    cancelLabel: '${w.id}.agent.confirm.no',
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

function specFile(w: ResolvedWeaver): string {
  return `import { EventType, type BaseEvent } from '@ag-ui/core';
import type { CommandArguments, PluginContext } from '@loomweaver/plugin-sdk';
import { ${w.propertyName}Connection } from './${w.id}-agent';

interface Asked {
  readonly id: string;
  readonly args?: CommandArguments;
}

function contextThat(confirms: boolean, ran: Asked[]): PluginContext {
  return {
    invocableCommands: () => [
      { id: '${w.id}.hello', title: '${w.name} action', description: 'Shows a short message.' },
    ],
    invokeCommand: (id: string, args?: CommandArguments) => {
      ran.push({ id, args });
      return Promise.resolve({ outcome: 'answered', value: 'it ran' });
    },
    ui: { confirm: () => Promise.resolve(confirms) },
  } as unknown as PluginContext;
}

function event(type: EventType, fields: Record<string, unknown>): BaseEvent {
  return { type, ...fields } as unknown as BaseEvent;
}

describe('${w.propertyName}Connection', () => {
  it('offers what the workbench offers', () => {
    const tools = ${w.propertyName}Connection(contextThat(true, []));
    expect(tools.list().map((tool) => tool.name)).toEqual(['${w.id}.hello']);
  });

  it('assembles a call from its events and answers with the outcome', async () => {
    const ran: Asked[] = [];
    const tools = ${w.propertyName}Connection(contextThat(true, ran));

    expect(
      await tools.receive(
        event(EventType.TOOL_CALL_START, {
          toolCallId: 'c1',
          toolCallName: '${w.id}.hello',
        }),
      ),
    ).toBeNull();
    await tools.receive(
      event(EventType.TOOL_CALL_ARGS, { toolCallId: 'c1', delta: '{"who"' }),
    );
    await tools.receive(
      event(EventType.TOOL_CALL_ARGS, { toolCallId: 'c1', delta: ':"you"}' }),
    );
    const answer = await tools.receive(
      event(EventType.TOOL_CALL_END, { toolCallId: 'c1' }),
    );

    expect(ran).toEqual([{ id: '${w.id}.hello', args: { who: 'you' } }]);
    expect(answer?.content).toBe('it ran');
    expect(answer?.error).toBeUndefined();
  });

  it('never reaches the workbench when a consequential call is declined', async () => {
    const ran: Asked[] = [];
    const tools = ${w.propertyName}Connection(contextThat(false, ran));

    await tools.receive(
      event(EventType.TOOL_CALL_START, {
        toolCallId: 'c2',
        toolCallName: '${w.id}.hello',
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

export function agentSurfaceBlock(w: ResolvedWeaver): string {
  return [
    '    ctx.registerSurface({',
    `      id: '${w.id}.agent',`,
    `      title: '${w.id}.agent.title',`,
    `      icon: '${w.id}',`,
    "      docks: ['right-panel'],",
    `      component: ${w.className}AgentPanel,`,
    '    });',
  ].join('\n');
}

export function agentFiles(w: ResolvedWeaver): FileMap {
  const files: Record<string, string> = {
    [`src/lib/agent/${w.id}-agent.ts`]: connectionFile(w),
    [`src/lib/agent/${w.id}-agent-source.ts`]: standInFile(w),
    [`src/lib/agent/${w.id}-agent-panel.ts`]: panelFile(w),
    [`src/lib/agent/${w.id}-agent-panel.html`]: panelTemplateFile(w),
  };
  if (w.features.spec) {
    files[`src/lib/agent/${w.id}-agent.spec.ts`] = specFile(w);
  }
  return files;
}
