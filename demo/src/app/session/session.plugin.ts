import { Plugin } from '@loomweaver/plugin-sdk';
import { sessionActions } from './session-actions';

export const sessionPlugin: Plugin = {
  manifest: {
    id: 'session',
    name: 'Account',
    capabilities: ['contributions'],
  },
  activate(ctx) {
    ctx.registerCommand({
      id: 'session.switchAccount',
      title: 'product.switchAccount',
      description: 'product.account.switchDescription',
      icon: 'account',
      access: { authenticated: true },
      run: () => sessionActions.switchAccount(),
    });
    ctx.registerCommand({
      id: 'session.signOut',
      title: 'product.signOut',
      description: 'product.account.signOutDescription',
      icon: 'signOut',
      access: { authenticated: true },
      run: () => sessionActions.signOut(),
    });
    ctx.registerCommand({
      id: 'session.signIn',
      title: 'product.signIn',
      description: 'product.account.signInDescription',
      icon: 'account',
      access: { authenticated: false },
      run: () => sessionActions.signIn(),
    });

    sessionActions.bind(ctx);
  },
  deactivate() {
    sessionActions.unbind();
  },
};
