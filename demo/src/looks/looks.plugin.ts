import { Plugin } from '@loomweaver/plugin-sdk';
import { LOOKS, type LookId } from './looks';
import { activeLook, switchLook } from './look-choice';

export const looksPlugin: Plugin = {
  manifest: {
    id: 'looks',
    name: 'Looks',
    capabilities: ['contributions'],
  },
  activate(ctx) {
    ctx.registerCommand({
      id: 'looks.switch',
      title: 'product.looks.command.title',
      description: 'product.looks.command.description',
      callable: true,
      answers: 'product.looks.command.answers',
      arguments: [
        {
          name: 'look',
          kind: 'choice',
          choices: LOOKS.map((look) => look.id),
          description: 'product.looks.command.arg.look',
          required: true,
        },
      ],
      run: (_context, args) => {
        const wanted = String(args?.['look']) as LookId;
        const look = LOOKS.find((candidate) => candidate.id === wanted);
        if (!look) {
          return { found: false };
        }
        if (look.id === activeLook.id) {
          return { look: look.id, changed: false, reloads: false };
        }
        switchLook(look.id);
        return { look: look.id, changed: true, reloads: true };
      },
    });
  },
};
