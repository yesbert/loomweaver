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
import { insightsPlugin } from '../insights/insights.plugin';
import { looksPlugin } from '../looks/looks.plugin';
import { quotesPlugin } from '../quotes/src';
import { AccountStatus } from '../session/account-status';
import { demoSession } from '../session/session';
import { paymentsIcon, paymentsPlugin } from '../payments/payments.plugin';
import { activeLook } from '../looks/look-choice';
import { LegalLink } from '../legal/legal-link';
import { LookSwitch } from '../looks/look-switch';

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
        id: 'demo.legal',
        bar: 'status-bar',
        slot: 'end',
        order: 100,
        component: LegalLink,
      },
    ),
    provideRailItems(
      {
        id: 'demo.workspace.dashboard',
        rail: 'primary',
        icon: 'insights',
        title: 'insights.dashboard.title',
        order: 0,
        workspace: 'dashboard',
      },
      {
        id: 'demo.workspace.quotes',
        rail: 'primary',
        icon: 'quotes',
        title: 'product.workspace.quotes',
        order: 1,
        workspace: 'quotes',
      },
      {
        id: 'demo.workspace.payments',
        rail: 'primary',
        icon: 'payments',
        title: 'product.workspace.payments',
        order: 2,
        workspace: 'payments',
      },
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
      quotes: ['contributions', 'navigation'],
      insights: ['contributions', 'navigation'],
      looks: ['contributions'],
      agent: ['contributions', 'ui', 'automation'],
      payments: ['contributions', 'session'],
    }),
    ...providePlugins(quotesPlugin, insightsPlugin, looksPlugin, agentPlugin),
    ...provideFramePlugins(paymentsPlugin),
    provideWorkspaces(
      {
        id: 'dashboard',
        title: 'insights.dashboard.title',
        icon: 'insights',
        initial: true,
        claims: [''],
        sidebars: {
          'left-panel': [],
          'right-panel': ['agent.chat'],
        },
      },
      {
        id: 'quotes',
        title: 'product.workspace.quotes',
        icon: 'quotes',
        claims: ['quotes/:id'],
        sidebars: {
          'left-panel': ['quotes'],
          'right-panel': ['agent.chat'],
        },
        content: {
          tabs: [{ path: 'quotes/q-0005', closable: false }],
        },
      },
      {
        id: 'payments',
        title: 'product.workspace.payments',
        icon: 'payments',
        claims: ['payments'],
        sidebars: {
          'left-panel': [],
          'right-panel': ['agent.chat'],
        },
        content: {
          tabs: [{ path: 'payments', closable: false }],
        },
      },
    ),
    provideProductIdentity({
      name: 'LoomWeaver Demo',
      tagline: 'product.tagline',
      logoUrl: 'logo.svg',
    }),
  ],
};
