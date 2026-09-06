import { type Disposable, type PluginContext } from '@loomweaver/plugin-sdk';
import { ACCOUNT_PICTURES, demoSession } from './session';

const ACCOUNT_MENU = 'session.account/menu';

let ctx: PluginContext | undefined;
let railItem: Disposable | undefined;
let entries: Disposable[] = [];

function initialsOf(name: string): string {
  const words = name.split(' ').filter((part) => part.length > 0);
  if (words.length === 0) {
    return '';
  }
  const first = words[0];
  const last = words[words.length - 1];
  return (first === last ? first[0] : first[0] + last[0]).toUpperCase();
}

function roleKey(roles: readonly string[]): string {
  return `product.role.${roles[0] ?? 'guest'}`;
}

function drop(): void {
  railItem?.dispose();
  railItem = undefined;
  for (const entry of entries) {
    entry.dispose();
  }
  entries = [];
}

export const sessionActions = {
  bind(next: PluginContext): void {
    ctx = next;
    sessionActions.draw();
  },
  unbind(): void {
    drop();
    ctx = undefined;
  },
  draw(): void {
    const host = ctx;
    if (!host) {
      return;
    }
    drop();

    const account = demoSession.account();
    const signedIn = demoSession.snapshot().authenticated;
    const name = account.displayName ?? '';
    const picture = ACCOUNT_PICTURES[account.subject ?? ''];

    railItem = host.registerRailItem({
      id: 'session.account',
      rail: 'secondary',
      icon: 'account',
      title: signedIn ? name : 'product.signIn',
      anchor: 'bottom',
      order: 20,
      menu: ACCOUNT_MENU,
      menuTrigger: 'primary',
      ...(signedIn ? { initials: initialsOf(name) } : {}),
      ...(signedIn && picture ? { image: picture } : {}),
      menuHeader: signedIn
        ? {
            title: name,
            detail: roleKey(account.roles),
            icon: 'account',
            initials: initialsOf(name),
            ...(picture ? { image: picture } : {}),
          }
        : { title: 'product.account.signedOut', icon: 'account' },
    });

    entries = signedIn
      ? [
          host.registerMenuItem({
            id: 'session.menu.switchAccount',
            menu: ACCOUNT_MENU,
            command: 'session.switchAccount',
            group: 'account',
            order: 10,
          }),
          host.registerMenuItem({
            id: 'session.menu.signOut',
            menu: ACCOUNT_MENU,
            command: 'session.signOut',
            group: 'account',
            order: 20,
          }),
        ]
      : [
          host.registerMenuItem({
            id: 'session.menu.signIn',
            menu: ACCOUNT_MENU,
            command: 'session.signIn',
            group: 'account',
            order: 10,
          }),
        ];
  },
  switchAccount(): void {
    demoSession.switchAccount();
    sessionActions.draw();
  },
  signOut(): void {
    demoSession.signOut();
    sessionActions.draw();
  },
  signIn(): void {
    demoSession.signIn();
    sessionActions.draw();
  },
};
