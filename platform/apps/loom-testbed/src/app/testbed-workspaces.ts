import { EnvironmentProviders, Provider } from '@angular/core';
import {
  provideRailItems,
  provideWorkspaces,
  WorkspaceDefinition,
} from '@loomweaver/shell';
import { e2eSwitches } from './e2e-switches';

function testbedWorkspaces(): readonly WorkspaceDefinition[] {
  return [
    {
      id: 'testbed.home',
      title: 'product.workspace.home',
      icon: 'testbedHome',
      sidebars: { 'left-panel': [], 'right-panel': [] },
      content: { tabs: [{ path: '', closable: false }] },
    },
    {
      id: 'testbed.dashboard',
      title: 'product.workspace.dashboard',
      icon: 'testbedDashboard',
      sidebars: { 'left-panel': [], 'right-panel': [] },
      content: {
        tabs: [
          { path: 'dashboard/overview', closable: false, active: true },
          { path: 'dashboard/trends', closable: false },
          { path: 'dashboard/export', closable: false },
        ],
      },
    },
    {
      id: 'testbed.review',
      title: 'product.workspace.review',
      icon: 'workspaces',
      claims: e2eSwitches.claimedEntries() === 'review' ? ['entry/:id'] : [],
      initial: e2eSwitches.initialWorkspace() === 'review',
      sidebars: { 'left-panel': ['testbed.nav'] },
      content: {
        columns: [
          { size: 35, tabs: [{ path: 'entry/e-01', closable: false }] },
          { rows: [{ size: 60, tabs: ['search'] }, { tabs: ['notes'] }] },
        ],
      },
    },
    {
      id: 'testbed.search',
      title: 'product.workspace.search',
      icon: 'search',
      content: { tabs: [{ path: 'search', closable: false }] },
    },
    {
      id: 'testbed.notes',
      title: 'product.workspace.notes',
      icon: 'edit',
      content: { tabs: [{ path: 'notes', closable: false }] },
    },
    {
      id: 'testbed.sandbox',
      title: 'product.workspace.sandbox',
      icon: 'testbedSandbox',
      claims: ['sandbox-rpc', 'omitted'],
      content: { tabs: [{ path: 'sandbox-rpc', closable: false }] },
    },
  ];
}

export function provideTestbedWorkspaces(): (Provider | EnvironmentProviders)[] {
  const workspaces = testbedWorkspaces();
  return [
    provideWorkspaces(...workspaces),
    ...provideRailItems(
      ...workspaces.map((workspace, order) => ({
        id: workspace.id.replace('testbed.', 'testbed.workspace.'),
        rail: 'primary',
        icon: workspace.icon ?? 'workspaces',
        title: workspace.title,
        order,
        workspace: workspace.id,
      })),
    ),
  ];
}
