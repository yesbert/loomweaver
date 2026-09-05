import { ApplicationConfig } from '@angular/core';
import {
  UpdateBadge,
  provideAuthSource,
  provideBarItems,
  provideCapabilityGrants,
  provideFramePlugins,
  provideIcons,
  provideLayout,
  providePlugins,
  provideRailItems,
  provideShell,
  provideShellRouter,
  provideTranslationNamespaces,
  provideTranslationOverrides,
  provideWorkspaces,
  type ShellLayout,
} from '@loomweaver/shell';
import { provideProductIdentity } from '@loomweaver/plugin-sdk';
import { agentPlugin } from '../agent/agent.plugin';
import { customersPlugin } from '../customers/customers.plugin';
import { navigationPlugin } from '../navigation/navigation.plugin';
import { MODULES, navSurfaceId } from '../navigation/module-tree';
import { insightsPlugin } from '../insights/insights.plugin';
import { looksPlugin } from '../looks/looks.plugin';
import { quotesPlugin } from '../quotes/src';
import { AccountStatus } from '../session/account-status';
import { demoSession } from '../session/session';
import { paymentsIcon, paymentsPlugin } from '../payments/payments.plugin';
import { activeLook } from '../looks/look-choice';
import { LegalLink } from '../legal/legal-link';
import { LookSwitch } from '../looks/look-switch';
import { PreviewBadge } from '../preview/preview-badge';

export const layout: ShellLayout = {
  regions: [
    { id: 'top-bar', type: 'bar', dock: 'top' },
    { id: 'primary', type: 'rail', dock: 'left' },
    { id: 'left-panel', type: 'panel', dock: 'left' },
    { id: 'right-panel', type: 'panel', dock: 'right' },
    { id: 'main', type: 'content', dock: 'center' },
    { id: 'status-bar', type: 'bar', dock: 'bottom' },
  ],
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideShellRouter(),
    provideShell(),
    provideLayout(layout),
    provideTranslationNamespaces(
      'product',
      'accounting',
      'quotes',
      'insights',
      'agent',
    ),
    provideIcons({ payments: paymentsIcon }),
    provideIcons(activeLook.icons),
    ...(activeLook.overrides
      ? [provideTranslationOverrides(activeLook.overrides)]
      : []),
    provideAuthSource(() => demoSession.snapshot),
    provideBarItems(
      {
        id: 'demo.search',
        bar: 'status-bar',
        slot: 'start',
        order: 10,
        icon: 'search',
        label: 'product.search',
        tooltip: 'palette.title',
        command: 'shell.commandPalette',
        showShortcut: true,
      },
      {
        id: 'demo.account',
        bar: 'status-bar',
        slot: 'start',
        order: 20,
        component: AccountStatus,
      },
      {
        id: 'demo.look',
        bar: 'status-bar',
        slot: 'end',
        order: 80,
        component: LookSwitch,
      },
      {
        id: 'shell.update',
        bar: 'status-bar',
        slot: 'end',
        order: 90,
        component: UpdateBadge,
      },
      {
        id: 'demo.preview',
        bar: 'status-bar',
        slot: 'end',
        order: 95,
        component: PreviewBadge,
      },
      {
        id: 'demo.legal',
        bar: 'status-bar',
        slot: 'end',
        order: 100,
        component: LegalLink,
      },
    ),
    provideRailItems(
      ...MODULES.map((module, index) => ({
        id: `demo.module.${module.id}`,
        rail: 'primary',
        icon: module.icon,
        title: module.titleKey,
        order: index,
        workspace: module.id,
      })),
      {
        id: 'demo.workspaces',
        rail: 'primary',
        icon: 'workspaces',
        title: 'workspace.title',
        anchor: 'bottom',
        order: 10,
        command: 'shell.workspace.manage',
      },
      {
        id: 'demo.settings',
        rail: 'primary',
        icon: 'settings',
        title: 'settings.title',
        anchor: 'bottom',
        order: 20,
        command: 'shell.openSettings',
      },
      {
        id: 'demo.switchAccount',
        rail: 'primary',
        icon: 'account',
        title: 'product.switchAccount',
        anchor: 'bottom',
        order: 25,
        access: { authenticated: true },
        run: () => demoSession.switchAccount(),
      },
      {
        id: 'demo.signOut',
        rail: 'primary',
        icon: 'signOut',
        title: 'product.signOut',
        anchor: 'bottom',
        order: 30,
        access: { authenticated: true },
        run: () => demoSession.signOut(),
      },
    ),
    provideCapabilityGrants({
      navigation: ['contributions', 'navigation'],
      customers: ['contributions', 'navigation', 'ui'],
      quotes: ['contributions', 'navigation'],
      insights: ['contributions', 'navigation'],
      looks: ['contributions'],
      agent: ['contributions', 'ui', 'automation'],
      payments: ['contributions', 'session'],
    }),
    ...providePlugins(
      navigationPlugin,
      customersPlugin,
      quotesPlugin,
      insightsPlugin,
      looksPlugin,
      agentPlugin,
    ),
    ...provideFramePlugins(paymentsPlugin),
    provideWorkspaces(
      ...MODULES.map((module) => ({
        id: module.id,
        title: module.titleKey,
        icon: module.icon,
        initial: module.id === 'overview',
        claims: [module.prefix],
        sidebars: {
          'left-panel':
            module.areas.length > 0
              ? [navSurfaceId(module.id)]
              : ['quotes.openItems'],
          'right-panel': ['agent.chat'],
        },
        ...(module.landing === null
          ? {}
          : { content: { tabs: [{ path: module.landing, closable: false }] } }),
      })),
    ),
    provideProductIdentity({
      name: 'LoomWeaver Demo',
      tagline: 'product.tagline',
      logoUrl: 'logo.svg',
    }),
  ],
};
