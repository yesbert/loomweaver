import { Plugin } from '@loomweaver/plugin-sdk';
import { AgentChatView } from './agent-chat';
import { agentRunner } from './agent-runner';

const agentIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9.5L5 20.5V17H4a1 1 0 0 1-1-1v-9.5a1 1 0 0 1 1-1z"/>' +
  '<path d="M12 8.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/></svg>';

export const agentPlugin: Plugin = {
  manifest: {
    id: 'agent',
    name: 'Assistant',
    capabilities: ['contributions', 'ui', 'automation'],
  },
  activate(ctx) {
    agentRunner.bind(ctx);
    ctx.contributeIcons({ agent: agentIcon });

    ctx.registerSurface({
      id: 'agent.chat',
      title: 'agent.title',
      icon: 'agent',
      docks: ['right-panel'],
      component: AgentChatView,
    });
  },
  deactivate() {
    agentRunner.unbind();
  },
};
