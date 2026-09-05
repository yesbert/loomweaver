import { Plugin } from '@loomweaver/plugin-sdk';
import { copilotAgent, copilotConnection } from '../agent/copilot-agent';
import { CopilotAgentPanel } from '../agent/copilot-agent-panel';

const icon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3v3M8 21h8M6 6h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><circle cx="9" cy="11.5" r="1"/><circle cx="15" cy="11.5" r="1"/></svg>';

export const copilotPlugin: Plugin = {
  manifest: {
    id: 'copilot',
    name: 'Copilot',
    capabilities: ['contributions', 'ui', 'automation'],
  },
  activate(ctx) {
    ctx.contributeIcons({ copilot: icon });
    copilotAgent.set(copilotConnection(ctx));
    ctx.registerSurface({
      id: 'copilot.agent',
      title: 'copilot.agent.title',
      icon: 'copilot',
      docks: ['right-panel'],
      component: CopilotAgentPanel,
    });
  },
  deactivate() {
    copilotAgent.set(null);
  },
};
