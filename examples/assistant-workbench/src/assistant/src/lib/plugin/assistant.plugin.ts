import { Plugin } from '@loomweaver/plugin-sdk';
import { assistantAgent, assistantConnection } from '../agent/assistant-agent';
import { AssistantAgentPanel } from '../agent/assistant-agent-panel';

const icon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3v3M8 21h8M6 6h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><circle cx="9" cy="11.5" r="1"/><circle cx="15" cy="11.5" r="1"/></svg>';

export const assistantPlugin: Plugin = {
  manifest: {
    id: 'assistant',
    name: 'Assistant',
    capabilities: ['contributions', 'ui', 'automation'],
  },
  activate(ctx) {
    ctx.contributeIcons({ assistant: icon });
    assistantAgent.set(assistantConnection(ctx));
    ctx.registerSurface({
      id: 'assistant.agent',
      title: 'assistant.agent.title',
      icon: 'assistant',
      docks: ['right-panel'],
      padded: true,
      component: AssistantAgentPanel,
    });
  },
  deactivate() {
    assistantAgent.set(null);
  },
};
